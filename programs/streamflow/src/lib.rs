```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("SF1ow1234567890123456789012345678901234567");

#[program]
pub mod streamflow {
    use super::*;

    pub fn initialize_stream(
        ctx: Context<InitializeStream>,
        recipient: Pubkey,
        start_time: i64,
        end_time: i64,
        amount: u64,
        cliff_time: Option<i64>,
        cancelable_by_sender: bool,
        cancelable_by_recipient: bool,
        transferable_by_sender: bool,
        transferable_by_recipient: bool,
    ) -> Result<()> {
        require!(start_time < end_time, StreamError::InvalidTimeRange);
        require!(amount > 0, StreamError::InvalidAmount);
        
        if let Some(cliff) = cliff_time {
            require!(cliff >= start_time && cliff <= end_time, StreamError::InvalidCliffTime);
        }

        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;

        stream.sender = ctx.accounts.sender.key();
        stream.recipient = recipient;
        stream.mint = ctx.accounts.mint.key();
        stream.escrow_token_account = ctx.accounts.escrow_token_account.key();
        stream.start_time = start_time;
        stream.end_time = end_time;
        stream.cliff_time = cliff_time;
        stream.amount = amount;
        stream.withdrawn_amount = 0;
        stream.canceled_at = None;
        stream.cancelable_by_sender = cancelable_by_sender;
        stream.cancelable_by_recipient = cancelable_by_recipient;
        stream.transferable_by_sender = transferable_by_sender;
        stream.transferable_by_recipient = transferable_by_recipient;
        stream.created_at = clock.unix_timestamp;
        stream.bump = *ctx.bumps.get("stream").unwrap();

        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(StreamCreated {
            stream: stream.key(),
            sender: stream.sender,
            recipient: stream.recipient,
            mint: stream.mint,
            amount: stream.amount,
            start_time: stream.start_time,
            end_time: stream.end_time,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);
        require!(current_time >= stream.start_time, StreamError::StreamNotStarted);

        let available_amount = calculate_available_amount(stream, current_time)?;
        require!(amount <= available_amount, StreamError::InsufficientFunds);

        stream.withdrawn_amount = stream.withdrawn_amount.checked_add(amount).unwrap();

        // Transfer tokens from escrow to recipient
        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            stream.mint.as_ref(),
            &stream.start_time.to_le_bytes(),
            &[stream.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: ctx.accounts.stream.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        emit!(TokensWithdrawn {
            stream: stream.key(),
            recipient: ctx.accounts.recipient.key(),
            amount,
            withdrawn_amount: stream.withdrawn_amount,
        });

        Ok(())
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(stream.canceled_at.is_none(), StreamError::StreamAlreadyCanceled);

        let is_sender = ctx.accounts.authority.key() == stream.sender;
        let is_recipient = ctx.accounts.authority.key() == stream.recipient;

        require!(
            (is_sender && stream.cancelable_by_sender) || 
            (is_recipient && stream.cancelable_by_recipient),
            StreamError::UnauthorizedCancel
        );

        stream.canceled_at = Some(current_time);

        let available_amount = calculate_available_amount(stream, current_time)?;
        let remaining_amount = stream.amount.checked_sub(stream.withdrawn_amount).unwrap();

        // Transfer available tokens to recipient if any
        if available_amount > 0 {
            let seeds = &[
                b"stream",
                stream.sender.as_ref(),
                stream.recipient.as_ref(),
                stream.mint.as_ref(),
                &stream.start_time.to_le_bytes(),
                &[stream.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, available_amount)?;

            stream.withdrawn_amount = stream.withdrawn_amount.checked_add(available_amount).unwrap();
        }

        // Return remaining tokens to sender
        let remaining_to_sender = remaining_amount.checked_sub(available_amount).unwrap();
        if remaining_to_sender > 0 {
            let seeds = &[
                b"stream",
                stream.sender.as_ref(),
                stream.recipient.as_ref(),
                stream.mint.as_ref(),
                &stream.start_time.to_le_bytes(),
                &[stream.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: ctx.accounts.stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, remaining_to_sender)?;
        }

        emit!(StreamCanceled {
            stream: stream.key(),
            canceled_by: ctx.accounts.authority.key(),
            canceled_at: current_time,
            recipient_amount: available_amount,
            sender_amount: remaining_to_sender,
        });

        Ok(())
    }

    pub fn transfer_stream(ctx: Context<TransferStream>, new_recipient: Pubkey) -> Result<()> {
        let stream = &mut ctx.accounts.stream;

        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        let is_sender = ctx.accounts.authority.key() == stream.sender;
        let is_recipient = ctx.accounts.authority.key() == stream.recipient;

        require!(
            (is_sender && stream.transferable_by_sender) || 
            (is_recipient && stream.transferable_by_recipient),
            StreamError::UnauthorizedTransfer
        );

        let old_recipient = stream.recipient;
        stream.recipient = new_recipient;

        emit!(StreamTransferred {
            stream: stream.key(),
            old_recipient,
            new_recipient,
            transferred_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }

    pub fn update_stream(
        ctx: Context<UpdateStream>,
        cancelable_by_sender: Option<bool>,
        cancelable_by_recipient: Option<bool>,
        transferable_by_sender: Option<bool>,
        transferable_by_recipient: Option<bool>,
    ) -> Result<()> {
        let stream = &mut ctx.accounts.stream;

        require!(ctx.accounts.authority.key() == stream.sender, StreamError::UnauthorizedUpdate);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        if let Some(cancelable_sender) = cancelable_by_sender {
            stream.cancelable_by_sender = cancelable_sender;
        }
        if let Some(cancelable_recipient) = cancelable_by_recipient {
            stream.cancelable_by_recipient = cancelable_recipient;
        }
        if let Some(transferable_sender) = transferable_by_sender {
            stream.transferable_by_sender = transferable_sender;
        }
        if let Some(transferable_recipient) = transferable_by_recipient {
            stream.transferable_by_recipient = transferable_recipient;
        }

        emit!(StreamUpdated {
            stream: stream.key(),
            updated_by: ctx.accounts.authority.key(),
        });

        Ok(())
    }
}

fn calculate_available_amount(stream: &Stream, current_time: i64) -> Result<u64> {
    if let Some(canceled_at) = stream.canceled_at {
        let effective_time = std::cmp::min(canceled_at, current_time);
        return calculate_streamed_amount(stream, effective_time);
    }

    if current_time < stream.start_time {
        return Ok(0);
    }

    if let Some(cliff_time) = stream.cliff_time {
        if current_time < cliff_time {
            return Ok(0);
        }
    }

    let streamed_amount = calculate_streamed_amount(stream, current_time)?;
    Ok(streamed_amount.checked_sub(stream.withdrawn_amount).unwrap())
}

fn calculate_streamed_amount(stream: &Stream, current_time: i64) -> Result<u64> {
    if current_time <= stream.start_time {
        return Ok(0);
    }

    if current_time >= stream.end_time {
        return Ok(stream.amount);
    }

    let elapsed_time = current_time.checked_sub(stream.start_time).unwrap() as u64;
    let total_time = stream.end_time.checked_sub(stream.start_time).unwrap() as u64;

    let streamed_amount = (stream.amount as u128)
        .checked_mul(elapsed_time as u128).unwrap()
        .checked_div(total_time as u128).unwrap() as u64;

    Ok(streamed_amount)
}

#[derive(Accounts)]
#[instruction(recipient: Pubkey, start_time: i64)]
pub struct InitializeStream<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + size_of::<Stream>(),
        seeds = [
            b"stream",
            sender.key().as_ref(),
            recipient.as_ref(),
            mint.key().as_ref(),
            &start_time.to_le_bytes()
        ],
        bump
    )]
    pub stream: Account<'info, Stream>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = sender_token_account.mint == mint.key(),
        constraint = sender_token_account.owner == sender.key()
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = sender,
        token::mint = mint,
        token::authority = stream,
        seeds = [
            b"escrow",
            stream.key().as_ref()
        ],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,

    pub recipient: Signer<'info>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == stream.escrow_token_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == escrow_token_account.mint,
        constraint = recipient_token_account.owner == recipient.key()
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,

    pub authority: Signer<'info>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == stream.escrow_token_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == escrow_token_account.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = sender_token_account.mint == escrow_token_account.mint
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,

    pub authority: Signer<'info>,
}

#[account]
pub struct Stream {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: Option<i64>,
    pub amount: u64,
    pub withdrawn_amount: