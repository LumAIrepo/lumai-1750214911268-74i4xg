```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"stream", stream.sender.as_ref(), stream.recipient.as_ref(), &stream.seed.to_le_bytes()],
        bump = stream.bump,
        constraint = stream.recipient == recipient.key() @ StreamFlowError::UnauthorizedRecipient,
        constraint = !stream.is_cancelled @ StreamFlowError::StreamCancelled,
        constraint = stream.withdrawn_amount < stream.total_amount @ StreamFlowError::StreamFullyWithdrawn
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        constraint = stream_token_account.mint == stream.mint @ StreamFlowError::InvalidMint,
        constraint = stream_token_account.owner == stream.key() @ StreamFlowError::InvalidTokenAccount
    )]
    pub stream_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint @ StreamFlowError::InvalidMint,
        constraint = recipient_token_account.owner == recipient.key() @ StreamFlowError::InvalidTokenAccount
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn withdraw(ctx: Context<Withdraw>, amount: Option<u64>) -> Result<()> {
    let stream = &mut ctx.accounts.stream;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Calculate available amount to withdraw
    let available_amount = calculate_available_amount(stream, current_time)?;
    
    require!(available_amount > 0, StreamFlowError::NoTokensAvailable);

    // Determine withdrawal amount
    let withdraw_amount = if let Some(requested_amount) = amount {
        require!(requested_amount <= available_amount, StreamFlowError::InsufficientAvailableTokens);
        requested_amount
    } else {
        available_amount
    };

    // Update stream state
    stream.withdrawn_amount = stream.withdrawn_amount
        .checked_add(withdraw_amount)
        .ok_or(StreamFlowError::MathOverflow)?;
    
    stream.last_withdrawn_at = current_time;

    // Transfer tokens from stream account to recipient
    let seeds = &[
        b"stream",
        stream.sender.as_ref(),
        stream.recipient.as_ref(),
        &stream.seed.to_le_bytes(),
        &[stream.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let transfer_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.stream_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: stream.to_account_info(),
        },
        signer_seeds,
    );

    token::transfer(transfer_ctx, withdraw_amount)?;

    // Emit withdrawal event
    emit!(WithdrawEvent {
        stream: stream.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: withdraw_amount,
        timestamp: current_time,
        remaining_amount: stream.total_amount
            .checked_sub(stream.withdrawn_amount)
            .ok_or(StreamFlowError::MathOverflow)?,
    });

    Ok(())
}

fn calculate_available_amount(stream: &Stream, current_time: u64) -> Result<u64> {
    // If stream hasn't started yet
    if current_time < stream.start_time {
        return Ok(0);
    }

    // If stream has ended, all remaining tokens are available
    if current_time >= stream.end_time {
        return Ok(stream.total_amount
            .checked_sub(stream.withdrawn_amount)
            .ok_or(StreamFlowError::MathOverflow)?);
    }

    // Calculate vested amount based on time elapsed
    let time_elapsed = current_time
        .checked_sub(stream.start_time)
        .ok_or(StreamFlowError::MathOverflow)?;
    
    let total_duration = stream.end_time
        .checked_sub(stream.start_time)
        .ok_or(StreamFlowError::MathOverflow)?;

    // Handle cliff period
    if let Some(cliff_time) = stream.cliff_time {
        if current_time < cliff_time {
            return Ok(0);
        }
    }

    let vested_amount = match stream.stream_type {
        StreamType::Linear => {
            // Linear vesting: amount = total_amount * time_elapsed / total_duration
            (stream.total_amount as u128)
                .checked_mul(time_elapsed as u128)
                .and_then(|result| result.checked_div(total_duration as u128))
                .and_then(|result| u64::try_from(result).ok())
                .ok_or(StreamFlowError::MathOverflow)?
        },
        StreamType::Cliff => {
            // Cliff vesting: all tokens available after cliff period
            if let Some(cliff_time) = stream.cliff_time {
                if current_time >= cliff_time {
                    stream.total_amount
                } else {
                    0
                }
            } else {
                return Err(StreamFlowError::InvalidStreamType.into());
            }
        },
        StreamType::SteppedLinear => {
            // Stepped linear vesting with release frequency
            let steps_elapsed = time_elapsed
                .checked_div(stream.release_frequency)
                .ok_or(StreamFlowError::MathOverflow)?;
            
            let total_steps = total_duration
                .checked_div(stream.release_frequency)
                .ok_or(StreamFlowError::MathOverflow)?;

            if total_steps == 0 {
                return Err(StreamFlowError::InvalidStreamConfiguration.into());
            }

            (stream.total_amount as u128)
                .checked_mul(steps_elapsed as u128)
                .and_then(|result| result.checked_div(total_steps as u128))
                .and_then(|result| u64::try_from(result).ok())
                .ok_or(StreamFlowError::MathOverflow)?
        },
    };

    // Available amount is vested amount minus already withdrawn amount
    let available = vested_amount
        .checked_sub(stream.withdrawn_amount)
        .ok_or(StreamFlowError::MathOverflow)?;

    Ok(available)
}

#[event]
pub struct WithdrawEvent {
    pub stream: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: u64,
    pub remaining_amount: u64,
}
```