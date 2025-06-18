```rust
use anchor_lang::prelude::*;

pub mod stream;
pub mod escrow;
pub mod treasury;

pub use stream::*;
pub use escrow::*;
pub use treasury::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum StreamStatus {
    Active,
    Paused,
    Cancelled,
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum StreamType {
    Linear,
    Cliff,
    Unlock,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum WithdrawFrequency {
    Continuous,
    Daily,
    Weekly,
    Monthly,
    Quarterly,
    Yearly,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StreamConfig {
    pub stream_type: StreamType,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: Option<i64>,
    pub withdraw_frequency: WithdrawFrequency,
    pub can_cancel: bool,
    pub can_pause: bool,
    pub can_update: bool,
    pub automatic_withdrawal: bool,
    pub withdrawal_public: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StreamMetrics {
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub last_withdrawal_time: i64,
    pub withdrawal_count: u32,
    pub pause_count: u32,
    pub total_paused_duration: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct FeeConfig {
    pub platform_fee_rate: u16, // basis points (100 = 1%)
    pub withdrawal_fee_rate: u16,
    pub cancellation_fee_rate: u16,
    pub fee_recipient: Pubkey,
}

impl Default for FeeConfig {
    fn default() -> Self {
        Self {
            platform_fee_rate: 25, // 0.25%
            withdrawal_fee_rate: 0,
            cancellation_fee_rate: 0,
            fee_recipient: Pubkey::default(),
        }
    }
}

impl Default for StreamConfig {
    fn default() -> Self {
        Self {
            stream_type: StreamType::Linear,
            start_time: 0,
            end_time: 0,
            cliff_time: None,
            withdraw_frequency: WithdrawFrequency::Continuous,
            can_cancel: true,
            can_pause: false,
            can_update: false,
            automatic_withdrawal: false,
            withdrawal_public: false,
        }
    }
}

impl Default for StreamMetrics {
    fn default() -> Self {
        Self {
            total_deposited: 0,
            total_withdrawn: 0,
            last_withdrawal_time: 0,
            withdrawal_count: 0,
            pause_count: 0,
            total_paused_duration: 0,
        }
    }
}

impl StreamConfig {
    pub fn validate(&self) -> Result<()> {
        require!(self.start_time > 0, StreamflowError::InvalidStartTime);
        require!(self.end_time > self.start_time, StreamflowError::InvalidEndTime);
        
        if let Some(cliff_time) = self.cliff_time {
            require!(
                cliff_time >= self.start_time && cliff_time <= self.end_time,
                StreamflowError::InvalidCliffTime
            );
        }
        
        Ok(())
    }
    
    pub fn duration(&self) -> i64 {
        self.end_time - self.start_time
    }
    
    pub fn is_cliff_reached(&self, current_time: i64) -> bool {
        match self.cliff_time {
            Some(cliff_time) => current_time >= cliff_time,
            None => current_time >= self.start_time,
        }
    }
    
    pub fn calculate_vested_amount(&self, total_amount: u64, current_time: i64) -> u64 {
        if current_time < self.start_time {
            return 0;
        }
        
        if !self.is_cliff_reached(current_time) {
            return 0;
        }
        
        if current_time >= self.end_time {
            return total_amount;
        }
        
        match self.stream_type {
            StreamType::Linear => {
                let elapsed = current_time - self.start_time;
                let duration = self.duration();
                ((total_amount as u128 * elapsed as u128) / duration as u128) as u64
            },
            StreamType::Cliff => {
                if self.is_cliff_reached(current_time) {
                    total_amount
                } else {
                    0
                }
            },
            StreamType::Unlock => {
                if current_time >= self.end_time {
                    total_amount
                } else {
                    0
                }
            },
        }
    }
}

impl StreamMetrics {
    pub fn update_withdrawal(&mut self, amount: u64, current_time: i64) {
        self.total_withdrawn = self.total_withdrawn.saturating_add(amount);
        self.last_withdrawal_time = current_time;
        self.withdrawal_count = self.withdrawal_count.saturating_add(1);
    }
    
    pub fn update_pause(&mut self, pause_duration: i64) {
        self.pause_count = self.pause_count.saturating_add(1);
        self.total_paused_duration = self.total_paused_duration.saturating_add(pause_duration);
    }
    
    pub fn available_to_withdraw(&self, total_deposited: u64) -> u64 {
        total_deposited.saturating_sub(self.total_withdrawn)
    }
}

#[error_code]
pub enum StreamflowError {
    #[msg("Invalid start time")]
    InvalidStartTime,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Invalid cliff time")]
    InvalidCliffTime,
    #[msg("Stream not active")]
    StreamNotActive,
    #[msg("Stream already started")]
    StreamAlreadyStarted,
    #[msg("Stream not started")]
    StreamNotStarted,
    #[msg("Stream already completed")]
    StreamAlreadyCompleted,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Cliff not reached")]
    CliffNotReached,
    #[msg("Cannot cancel stream")]
    CannotCancelStream,
    #[msg("Cannot pause stream")]
    CannotPauseStream,
    #[msg("Cannot update stream")]
    CannotUpdateStream,
    #[msg("Invalid recipient")]
    InvalidRecipient,
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid fee configuration")]
    InvalidFeeConfig,
    #[msg("Fee calculation error")]
    FeeCalculationError,
}
```