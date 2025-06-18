```typescript
import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { StreamFlow } from './types/streamflow';
import streamflowIdl from './idl/streamflow.json';

export const STREAMFLOW_PROGRAM_ID = new PublicKey('HqDGZjaVRXJ9MGRQEw7qDc2rAr6iH1n1kAQdCZaCMfMZ');

export interface StreamData {
  sender: PublicKey;
  recipient: PublicKey;
  mint: PublicKey;
  escrowTokenAccount: PublicKey;
  amount: BN;
  startTime: BN;
  endTime: BN;
  cliffTime: BN;
  amountWithdrawn: BN;
  canceled: boolean;
  paused: boolean;
  pausedAt: BN;
  totalPausedTime: BN;
  name: string;
  canUpdate: boolean;
  canCancel: boolean;
  canTransfer: boolean;
  automaticWithdrawal: boolean;
  withdrawalFrequency: BN;
  lastWithdrawalTime: BN;
}

export interface CreateStreamParams {
  recipient: PublicKey;
  mint: PublicKey;
  amount: BN;
  startTime: BN;
  endTime: BN;
  cliffTime?: BN;
  name: string;
  canUpdate?: boolean;
  canCancel?: boolean;
  canTransfer?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: BN;
}

export interface UpdateStreamParams {
  streamId: PublicKey;
  name?: string;
  canUpdate?: boolean;
  canCancel?: boolean;
  canTransfer?: boolean;
  automaticWithdrawal?: boolean;
  withdrawalFrequency?: BN;
}

export class AnchorClient {
  private connection: Connection;
  private provider: AnchorProvider | null = null;
  private program: Program<StreamFlow> | null = null;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  setWallet(wallet: Wallet) {
    this.provider = new AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
    this.program = new Program(streamflowIdl as StreamFlow, STREAMFLOW_PROGRAM_ID, this.provider);
  }

  getProgram(): Program<StreamFlow> {
    if (!this.program) {
      throw new Error('Program not initialized. Call setWallet first.');
    }
    return this.program;
  }

  getProvider(): AnchorProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call setWallet first.');
    }
    return this.provider;
  }

  async createStream(params: CreateStreamParams): Promise<{ streamId: PublicKey; signature: string }> {
    const program = this.getProgram();
    const provider = this.getProvider();

    const streamId = Keypair.generate();
    const senderTokenAccount = await getAssociatedTokenAddress(params.mint, provider.wallet.publicKey);
    const escrowTokenAccount = await getAssociatedTokenAddress(params.mint, streamId.publicKey, true);

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.publicKey.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const tx = await program.methods
      .createStream(
        params.amount,
        params.startTime,
        params.endTime,
        params.cliffTime || new BN(0),
        params.name,
        params.canUpdate || false,
        params.canCancel || true,
        params.canTransfer || false,
        params.automaticWithdrawal || false,
        params.withdrawalFrequency || new BN(0)
      )
      .accounts({
        stream: streamPda,
        streamId: streamId.publicKey,
        sender: provider.wallet.publicKey,
        recipient: params.recipient,
        mint: params.mint,
        senderTokenAccount,
        escrowTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([streamId])
      .rpc();

    return { streamId: streamId.publicKey, signature: tx };
  }

  async withdrawFromStream(streamId: PublicKey, amount?: BN): Promise<string> {
    const program = this.getProgram();
    const provider = this.getProvider();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const streamData = await this.getStreamData(streamId);
    const recipientTokenAccount = await getAssociatedTokenAddress(streamData.mint, provider.wallet.publicKey);
    const escrowTokenAccount = await getAssociatedTokenAddress(streamData.mint, streamId, true);

    const tx = await program.methods
      .withdraw(amount || null)
      .accounts({
        stream: streamPda,
        streamId,
        recipient: provider.wallet.publicKey,
        recipientTokenAccount,
        escrowTokenAccount,
        mint: streamData.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  async cancelStream(streamId: PublicKey): Promise<string> {
    const program = this.getProgram();
    const provider = this.getProvider();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const streamData = await this.getStreamData(streamId);
    const senderTokenAccount = await getAssociatedTokenAddress(streamData.mint, streamData.sender);
    const recipientTokenAccount = await getAssociatedTokenAddress(streamData.mint, streamData.recipient);
    const escrowTokenAccount = await getAssociatedTokenAddress(streamData.mint, streamId, true);

    const tx = await program.methods
      .cancel()
      .accounts({
        stream: streamPda,
        streamId,
        sender: streamData.sender,
        recipient: streamData.recipient,
        senderTokenAccount,
        recipientTokenAccount,
        escrowTokenAccount,
        mint: streamData.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  async pauseStream(streamId: PublicKey): Promise<string> {
    const program = this.getProgram();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const tx = await program.methods
      .pause()
      .accounts({
        stream: streamPda,
        streamId,
        sender: this.getProvider().wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async resumeStream(streamId: PublicKey): Promise<string> {
    const program = this.getProgram();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const tx = await program.methods
      .resume()
      .accounts({
        stream: streamPda,
        streamId,
        sender: this.getProvider().wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async updateStream(params: UpdateStreamParams): Promise<string> {
    const program = this.getProgram();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), params.streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const tx = await program.methods
      .update(
        params.name || null,
        params.canUpdate !== undefined ? params.canUpdate : null,
        params.canCancel !== undefined ? params.canCancel : null,
        params.canTransfer !== undefined ? params.canTransfer : null,
        params.automaticWithdrawal !== undefined ? params.automaticWithdrawal : null,
        params.withdrawalFrequency || null
      )
      .accounts({
        stream: streamPda,
        streamId: params.streamId,
        sender: this.getProvider().wallet.publicKey,
      })
      .rpc();

    return tx;
  }

  async transferStream(streamId: PublicKey, newRecipient: PublicKey): Promise<string> {
    const program = this.getProgram();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const tx = await program.methods
      .transfer()
      .accounts({
        stream: streamPda,
        streamId,
        currentRecipient: this.getProvider().wallet.publicKey,
        newRecipient,
      })
      .rpc();

    return tx;
  }

  async getStreamData(streamId: PublicKey): Promise<StreamData> {
    const program = this.getProgram();

    const [streamPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('stream'), streamId.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    );

    const streamAccount = await program.account.stream.fetch(streamPda);
    
    return {
      sender: streamAccount.sender,
      recipient: streamAccount.recipient,
      mint: streamAccount.mint,
      escrowTokenAccount: streamAccount.escrowTokenAccount,
      amount: streamAccount.amount,
      startTime: streamAccount.startTime,
      endTime: streamAccount.endTime,
      cliffTime: streamAccount.cliffTime,
      amountWithdrawn: streamAccount.amountWithdrawn,
      canceled: streamAccount.canceled,
      paused: streamAccount.paused,
      pausedAt: streamAccount.pausedAt,
      totalPausedTime: streamAccount.totalPausedTime,
      name: streamAccount.name,
      canUpdate: streamAccount.canUpdate,
      canCancel: streamAccount.canCancel,
      canTransfer: streamAccount.canTransfer,
      automaticWithdrawal: streamAccount.automaticWithdrawal,
      withdrawalFrequency: streamAccount.withdrawalFrequency,
      lastWithdrawalTime: streamAccount.lastWithdrawalTime,
    };
  }

  async getAllStreams(wallet?: PublicKey): Promise<Array<{ publicKey: PublicKey; account: StreamData }>> {
    const program = this.getProgram();
    const walletKey = wallet || this.getProvider().wallet.publicKey;

    const streams = await program.account.stream.all([
      {
        memcmp: {
          offset: 8,
          bytes: walletKey.toBase58(),
        },
      },
    ]);

    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: {
        sender: stream.account.sender,
        recipient: stream.account.recipient,
        mint: stream.account.mint,
        escrowTokenAccount: stream.account.escrowTokenAccount,
        amount: stream.account.amount,
        startTime: stream.account.startTime,
        endTime: stream.account.endTime,
        cliffTime: stream.account.cliffTime,
        amountWithdrawn: stream.account.amountWithdrawn,
        canceled: stream.account.canceled,
        paused: stream.account.paused,
        pausedAt: stream.account.pausedAt,
        totalPausedTime: stream.account.totalPausedTime,
        name: stream.account.name,
        canUpdate: stream.account.canUpdate,
        canCancel: stream.account.canCancel,
        canTransfer: stream.account.canTransfer,
        automaticWithdrawal: stream.account.automaticWithdrawal,
        withdrawalFrequency: stream.account.withdrawalFrequency,
        lastWithdrawalTime: stream.account.lastWithdrawalTime,
      },
    }));
  }

  async getStreamsByRecipient(recipient: PublicKey): Promise<Array<{ publicKey: PublicKey; account: StreamData }>> {
    const program = this.getProgram();

    const streams = await program.account.stream.all([
      {
        memcmp: {
          offset: 40,
          bytes: recipient.toBase58(),
        },
      },
    ]);

    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: {
        sender: stream.account.sender,
        recipient: stream.account.recipient,
        mint: stream.account.mint,
        escrowTokenAccount: stream.account.escrowTokenAccount,
        amount: stream.account.amount,
        startTime: stream.account.startTime,
        endTime: stream.account.endTime,
        cliffTime: stream.account.cliffTime,
        amountWithdrawn: stream.account.amountWithdrawn,
        canceled: stream.account.canceled,
        paused: stream.account.paused,
        pausedAt: stream.account.pausedAt,
        totalPausedTime: stream.account.totalPausedTime,
        name: stream.account.name,
        canUpdate: stream.account.canUpdate,
        canCancel: stream.account.canCancel,
        canTransfer: stream.account.canTransfer,
        automaticWithdrawal: stream.account.automaticWithdrawal,
        withdrawalFrequency: stream.account.withdrawalFrequency,
        lastWithdrawalTime: stream.account.lastWithdrawalTime,
      },
    }));
  }

  calculateWithdrawableAmount(streamData: StreamData): BN {
    const now = new BN(Date.now() / 1000);
    
    if (streamData.canceled || now.lt(streamData.startTime)) {
      return new BN(0);
    }

    let effectiveTime = now;
    if (streamData.paused) {
      effectiveTime = streamData.pausedAt;
    }

    if (effectiveTime.lt(streamData.cliffTime)) {
      return new BN(0);
    }

    const totalDuration = streamData.endTime.sub(streamData.startTime);
    const elapsedTime = effectiveTime.sub(streamData.startTime).sub(streamData.totalPausedTime);
    
    if (elapsedTime.gte(totalDuration)) {
      return streamData.amount.sub(streamData.amountWithdrawn);
    }

    const vestedAmount = streamData.amount.mul(elapsedTime).div(totalDuration);
    return vestedAmount.sub(streamData.amountWithdrawn);
  }

  getStreamProgress(streamData: StreamData): number {
    const now = new BN(Date.now() / 1000);
    
    if