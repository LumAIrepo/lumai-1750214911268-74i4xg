```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(
        mut,
        seeds = [b"stream", stream.sender.as_ref(), stream.recipient.as_ref(), &stream.seed.to_le_bytes()],
        bump = stream.bump,
        has_one = sender @ StreamError::Unauthorized,
        constraint = stream.status == StreamStatus::Active @ StreamError::StreamNotActive,
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        constraint = sender_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = sender_token_account.owner == sender.key() @ StreamError::InvalidTokenAccount,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = recipient_token_account.owner == stream.recipient @ StreamError::InvalidTokenAccount,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"escrow", stream.key().as_ref()],
        bump = stream.escrow_bump,
        constraint = escrow_token_account.mint == stream.mint @ StreamError::InvalidMint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
    let stream = &mut ctx.accounts.stream;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Calculate how much has been streamed so far
    let elapsed_time = if current_time > stream.start_time {
        std::cmp::min(current_time - stream.start_time, stream.duration as i64)
    } else {
        0
    };

    let streamed_amount = if elapsed_time > 0 {
        (stream.amount as u128 * elapsed_time as u128 / stream.duration as u128) as u64
    } else {
        0
    };

    let remaining_amount = stream.amount - streamed_amount;

    // Transfer streamed amount to recipient if any
    if streamed_amount > 0 {
        let stream_key = stream.key();
        let seeds = &[
            b"escrow",
            stream_key.as_ref(),
            &[stream.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.escrow_token_account.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, streamed_amount)?;
    }

    // Return remaining amount to sender
    if remaining_amount > 0 {
        let stream_key = stream.key();
        let seeds = &[
            b"escrow",
            stream_key.as_ref(),
            &[stream.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.sender_token_account.to_account_info(),
            authority: ctx.accounts.escrow_token_account.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, remaining_amount)?;
    }

    // Update stream status
    stream.status = StreamStatus::Cancelled;
    stream.cancelled_at = Some(current_time);
    stream.withdrawn_amount = streamed_amount;

    emit!(StreamCancelled {
        stream: stream.key(),
        sender: stream.sender,
        recipient: stream.recipient,
        streamed_amount,
        returned_amount: remaining_amount,
        cancelled_at: current_time,
    });

    Ok(())
}

#[event]
pub struct StreamCancelled {
    pub stream: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub streamed_amount: u64,
    pub returned_amount: u64,
    pub cancelled_at: i64,
}
```