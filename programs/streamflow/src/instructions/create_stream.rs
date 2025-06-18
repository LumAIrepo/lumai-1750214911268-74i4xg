```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(stream_id: String)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = sender,
        space = Stream::LEN,
        seeds = [b"stream", sender.key().as_ref(), stream_id.as_bytes()],
        bump
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = stream,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key(),
        constraint = sender_token_account.mint == mint.key()
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<CreateStream>,
    stream_id: String,
    amount: u64,
    start_time: i64,
    end_time: i64,
    cliff_time: Option<i64>,
    cancelable_by_sender: bool,
    cancelable_by_recipient: bool,
    transferable_by_sender: bool,
    transferable_by_recipient: bool,
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp;

    // Validation checks
    require!(amount > 0, StreamFlowError::InvalidAmount);
    require!(start_time >= current_time, StreamFlowError::InvalidStartTime);
    require!(end_time > start_time, StreamFlowError::InvalidEndTime);
    require!(stream_id.len() <= 32, StreamFlowError::StreamIdTooLong);

    if let Some(cliff) = cliff_time {
        require!(cliff >= start_time && cliff <= end_time, StreamFlowError::InvalidCliffTime);
    }

    // Check sender has sufficient balance
    require!(
        ctx.accounts.sender_token_account.amount >= amount,
        StreamFlowError::InsufficientBalance
    );

    let stream = &mut ctx.accounts.stream;
    let bump = ctx.bumps.stream;

    // Initialize stream account
    stream.sender = ctx.accounts.sender.key();
    stream.recipient = ctx.accounts.recipient.key();
    stream.mint = ctx.accounts.mint.key();
    stream.escrow_token_account = ctx.accounts.escrow_token_account.key();
    stream.amount = amount;
    stream.withdrawn_amount = 0;
    stream.start_time = start_time;
    stream.end_time = end_time;
    stream.cliff_time = cliff_time;
    stream.created_at = current_time;
    stream.canceled_at = None;
    stream.cancelable_by_sender = cancelable_by_sender;
    stream.cancelable_by_recipient = cancelable_by_recipient;
    stream.transferable_by_sender = transferable_by_sender;
    stream.transferable_by_recipient = transferable_by_recipient;
    stream.stream_id = stream_id;
    stream.bump = bump;
    stream.escrow_bump = ctx.bumps.escrow_token_account;

    // Transfer tokens from sender to escrow
    let transfer_instruction = Transfer {
        from: ctx.accounts.sender_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.sender.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_instruction,
    );

    token::transfer(cpi_ctx, amount)?;

    emit!(StreamCreated {
        stream: stream.key(),
        sender: stream.sender,
        recipient: stream.recipient,
        mint: stream.mint,
        amount: stream.amount,
        start_time: stream.start_time,
        end_time: stream.end_time,
        cliff_time: stream.cliff_time,
        stream_id: stream.stream_id.clone(),
    });

    Ok(())
}

#[event]
pub struct StreamCreated {
    pub stream: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: Option<i64>,
    pub stream_id: String,
}
```