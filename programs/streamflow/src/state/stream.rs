```rust
use anchor_lang::prelude::*;

#[account]
pub struct Stream {
    /// The authority that can modify the stream
    pub authority: Pubkey,
    /// The recipient of the stream
    pub recipient: Pubkey,
    /// The mint of the token being streamed
    pub mint: Pubkey,
    /// The token account holding the streamed tokens
    pub token_account: Pubkey,
    /// The total amount of tokens in the stream
    pub total_amount: u64,
    /// The amount of tokens already withdrawn
    pub withdrawn_amount: u64,
    /// The start time of the stream (Unix timestamp)
    pub start_time: i64,
    /// The end time of the stream (Unix timestamp)
    pub end_time: i64,
    /// The cliff time (Unix timestamp) - tokens cannot be withdrawn before this
    pub cliff_time: i64,
    /// Whether the stream can be cancelled by the authority
    pub cancelable: bool,
    /// Whether the stream has been cancelled
    pub cancelled: bool,
    /// The time when the stream was cancelled (if applicable)
    pub cancelled_at: i64,
    /// The name/description of the stream
    pub name: [u8; 64],
    /// The category of the stream (0: Vesting, 1: Streaming, 2: Lock)
    pub category: u8,
    /// Whether the recipient can transfer the stream to another address
    pub transferable: bool,
    /// The rate at which tokens are released per second
    pub rate_per_second: u64,
    /// The last time tokens were withdrawn
    pub last_withdrawn_at: i64,
    /// Bump seed for PDA derivation
    pub bump: u8,
    /// Reserved space for future upgrades
    pub reserved: [u8; 128],
}

impl Stream {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // recipient
        32 + // mint
        32 + // token_account
        8 + // total_amount
        8 + // withdrawn_amount
        8 + // start_time
        8 + // end_time
        8 + // cliff_time
        1 + // cancelable
        1 + // cancelled
        8 + // cancelled_at
        64 + // name
        1 + // category
        1 + // transferable
        8 + // rate_per_second
        8 + // last_withdrawn_at
        1 + // bump
        128; // reserved

    /// Calculate the amount of tokens that can be withdrawn at the current time
    pub fn withdrawable_amount(&self, current_time: i64) -> Result<u64> {
        if self.cancelled {
            return Ok(0);
        }

        if current_time < self.cliff_time {
            return Ok(0);
        }

        let effective_start = std::cmp::max(self.start_time, self.cliff_time);
        let effective_current = std::cmp::min(current_time, self.end_time);

        if effective_current <= effective_start {
            return Ok(0);
        }

        let elapsed_time = effective_current - effective_start;
        let total_duration = self.end_time - effective_start;

        if total_duration <= 0 {
            return Ok(self.total_amount.saturating_sub(self.withdrawn_amount));
        }

        let vested_amount = (self.total_amount as u128)
            .checked_mul(elapsed_time as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(total_duration as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        Ok(vested_amount.saturating_sub(self.withdrawn_amount))
    }

    /// Check if the stream is active (not cancelled and within time bounds)
    pub fn is_active(&self, current_time: i64) -> bool {
        !self.cancelled && current_time >= self.start_time && current_time <= self.end_time
    }

    /// Check if the stream has ended
    pub fn is_ended(&self, current_time: i64) -> bool {
        current_time > self.end_time || self.cancelled
    }

    /// Check if the stream is fully withdrawn
    pub fn is_fully_withdrawn(&self) -> bool {
        self.withdrawn_amount >= self.total_amount
    }

    /// Get the remaining amount in the stream
    pub fn remaining_amount(&self) -> u64 {
        self.total_amount.saturating_sub(self.withdrawn_amount)
    }

    /// Calculate the progress of the stream as a percentage (0-100)
    pub fn progress_percentage(&self, current_time: i64) -> u8 {
        if self.cancelled || current_time < self.start_time {
            return 0;
        }

        if current_time >= self.end_time {
            return 100;
        }

        let elapsed = current_time - self.start_time;
        let total_duration = self.end_time - self.start_time;

        if total_duration <= 0 {
            return 100;
        }

        let percentage = (elapsed as u128 * 100) / total_duration as u128;
        std::cmp::min(percentage as u8, 100)
    }

    /// Validate stream parameters
    pub fn validate_params(
        start_time: i64,
        end_time: i64,
        cliff_time: i64,
        total_amount: u64,
    ) -> Result<()> {
        require!(start_time > 0, ErrorCode::InvalidStartTime);
        require!(end_time > start_time, ErrorCode::InvalidEndTime);
        require!(cliff_time >= start_time, ErrorCode::InvalidCliffTime);
        require!(cliff_time <= end_time, ErrorCode::InvalidCliffTime);
        require!(total_amount > 0, ErrorCode::InvalidAmount);
        Ok(())
    }

    /// Update the stream after withdrawal
    pub fn update_after_withdrawal(&mut self, amount: u64, current_time: i64) -> Result<()> {
        self.withdrawn_amount = self.withdrawn_amount
            .checked_add(amount)
            .ok_or(ErrorCode::MathOverflow)?;
        self.last_withdrawn_at = current_time;
        Ok(())
    }

    /// Cancel the stream
    pub fn cancel(&mut self, current_time: i64) -> Result<()> {
        require!(self.cancelable, ErrorCode::StreamNotCancelable);
        require!(!self.cancelled, ErrorCode::StreamAlreadyCancelled);
        
        self.cancelled = true;
        self.cancelled_at = current_time;
        Ok(())
    }

    /// Transfer the stream to a new recipient
    pub fn transfer_to(&mut self, new_recipient: Pubkey) -> Result<()> {
        require!(self.transferable, ErrorCode::StreamNotTransferable);
        require!(!self.cancelled, ErrorCode::StreamCancelled);
        
        self.recipient = new_recipient;
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum StreamCategory {
    Vesting = 0,
    Streaming = 1,
    Lock = 2,
}

impl From<u8> for StreamCategory {
    fn from(value: u8) -> Self {
        match value {
            0 => StreamCategory::Vesting,
            1 => StreamCategory::Streaming,
            2 => StreamCategory::Lock,
            _ => StreamCategory::Streaming,
        }
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid start time")]
    InvalidStartTime,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Invalid cliff time")]
    InvalidCliffTime,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Stream is not cancelable")]
    StreamNotCancelable,
    #[msg("Stream is already cancelled")]
    StreamAlreadyCancelled,
    #[msg("Stream is cancelled")]
    StreamCancelled,
    #[msg("Stream is not transferable")]
    StreamNotTransferable,
    #[msg("Insufficient withdrawable amount")]
    InsufficientWithdrawableAmount,
    #[msg("Stream has not started yet")]
    StreamNotStarted,
    #[msg("Stream has ended")]
    StreamEnded,
    #[msg("Cliff period not reached")]
    CliffNotReached,
}
```