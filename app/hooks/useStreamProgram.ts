```typescript
'use client'

import { useState, useCallback, useMemo } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  AccountMeta,
  Keypair
} from '@solana/web3.js'
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'

// StreamFlow program constants
const STREAMFLOW_PROGRAM_ID = new PublicKey('strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m')
const STREAM_SEED = 'stream'
const ESCROW_SEED = 'escrow'

export interface StreamData {
  id: string
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  amount: BN
  startTime: BN
  endTime: BN
  cliffTime: BN
  amountWithdrawn: BN
  canceled: boolean
  paused: boolean
  created: BN
  name: string
  canTopup: boolean
  canUpdate: boolean
  canPause: boolean
  canCancel: boolean
  automaticWithdrawal: boolean
  withdrawalFrequency: BN
}

export interface CreateStreamParams {
  recipient: PublicKey
  mint: PublicKey
  amount: number
  startTime: Date
  endTime: Date
  cliffTime?: Date
  name: string
  canTopup?: boolean
  canUpdate?: boolean
  canPause?: boolean
  canCancel?: boolean
  automaticWithdrawal?: boolean
  withdrawalFrequency?: number
}

export interface WithdrawParams {
  streamId: string
  amount?: number
}

export interface TopupParams {
  streamId: string
  amount: number
}

export interface UpdateStreamParams {
  streamId: string
  name?: string
  canTopup?: boolean
  canUpdate?: boolean
  canPause?: boolean
  canCancel?: boolean
  automaticWithdrawal?: boolean
  withdrawalFrequency?: number
}

export const useStreamProgram = () => {
  const { connection } = useConnection()
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const [loading, setLoading] = useState(false)
  const [streams, setStreams] = useState<StreamData[]>([])

  // Generate stream PDA
  const getStreamPDA = useCallback((sender: PublicKey, recipient: PublicKey, mint: PublicKey, startTime: BN) => {
    const [streamPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(STREAM_SEED),
        sender.toBuffer(),
        recipient.toBuffer(),
        mint.toBuffer(),
        startTime.toArrayLike(Buffer, 'le', 8)
      ],
      STREAMFLOW_PROGRAM_ID
    )
    return streamPDA
  }, [])

  // Generate escrow PDA
  const getEscrowPDA = useCallback((streamPDA: PublicKey) => {
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(ESCROW_SEED), streamPDA.toBuffer()],
      STREAMFLOW_PROGRAM_ID
    )
    return escrowPDA
  }, [])

  // Create stream instruction
  const createStreamInstruction = useCallback(async (params: CreateStreamParams) => {
    if (!publicKey) throw new Error('Wallet not connected')

    const startTimeBN = new BN(Math.floor(params.startTime.getTime() / 1000))
    const endTimeBN = new BN(Math.floor(params.endTime.getTime() / 1000))
    const cliffTimeBN = params.cliffTime ? new BN(Math.floor(params.cliffTime.getTime() / 1000)) : startTimeBN
    const amountBN = new BN(params.amount * LAMPORTS_PER_SOL)
    const withdrawalFrequencyBN = new BN(params.withdrawalFrequency || 0)

    const streamPDA = getStreamPDA(publicKey, params.recipient, params.mint, startTimeBN)
    const escrowPDA = getEscrowPDA(streamPDA)

    const senderATA = await getAssociatedTokenAddress(params.mint, publicKey)
    const escrowATA = await getAssociatedTokenAddress(params.mint, escrowPDA, true)

    const accounts: AccountMeta[] = [
      { pubkey: publicKey, isSigner: true, isWritable: true },
      { pubkey: params.recipient, isSigner: false, isWritable: false },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: senderATA, isSigner: false, isWritable: true },
      { pubkey: escrowATA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ]

    const data = Buffer.concat([
      Buffer.from([0]), // Create stream instruction discriminator
      amountBN.toArrayLike(Buffer, 'le', 8),
      startTimeBN.toArrayLike(Buffer, 'le', 8),
      endTimeBN.toArrayLike(Buffer, 'le', 8),
      cliffTimeBN.toArrayLike(Buffer, 'le', 8),
      Buffer.from([params.canTopup ? 1 : 0]),
      Buffer.from([params.canUpdate ? 1 : 0]),
      Buffer.from([params.canPause ? 1 : 0]),
      Buffer.from([params.canCancel ? 1 : 0]),
      Buffer.from([params.automaticWithdrawal ? 1 : 0]),
      withdrawalFrequencyBN.toArrayLike(Buffer, 'le', 8),
      Buffer.from([params.name.length]),
      Buffer.from(params.name, 'utf8')
    ])

    return new TransactionInstruction({
      keys: accounts,
      programId: STREAMFLOW_PROGRAM_ID,
      data
    })
  }, [publicKey, getStreamPDA, getEscrowPDA])

  // Withdraw from stream instruction
  const withdrawInstruction = useCallback(async (params: WithdrawParams) => {
    if (!publicKey) throw new Error('Wallet not connected')

    const streamPDA = new PublicKey(params.streamId)
    const escrowPDA = getEscrowPDA(streamPDA)

    // Get stream data to determine mint and sender
    const streamAccount = await connection.getAccountInfo(streamPDA)
    if (!streamAccount) throw new Error('Stream not found')

    // Parse stream data (simplified - in real implementation, use proper deserialization)
    const mint = new PublicKey(streamAccount.data.slice(40, 72))
    const recipientATA = await getAssociatedTokenAddress(mint, publicKey)
    const escrowATA = await getAssociatedTokenAddress(mint, escrowPDA, true)

    const accounts: AccountMeta[] = [
      { pubkey: publicKey, isSigner: true, isWritable: true },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: recipientATA, isSigner: false, isWritable: true },
      { pubkey: escrowATA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const amountBN = params.amount ? new BN(params.amount * LAMPORTS_PER_SOL) : new BN(0)
    const data = Buffer.concat([
      Buffer.from([1]), // Withdraw instruction discriminator
      amountBN.toArrayLike(Buffer, 'le', 8)
    ])

    return new TransactionInstruction({
      keys: accounts,
      programId: STREAMFLOW_PROGRAM_ID,
      data
    })
  }, [publicKey, connection, getEscrowPDA])

  // Cancel stream instruction
  const cancelStreamInstruction = useCallback(async (streamId: string) => {
    if (!publicKey) throw new Error('Wallet not connected')

    const streamPDA = new PublicKey(streamId)
    const escrowPDA = getEscrowPDA(streamPDA)

    // Get stream data
    const streamAccount = await connection.getAccountInfo(streamPDA)
    if (!streamAccount) throw new Error('Stream not found')

    const mint = new PublicKey(streamAccount.data.slice(40, 72))
    const sender = new PublicKey(streamAccount.data.slice(8, 40))
    const recipient = new PublicKey(streamAccount.data.slice(72, 104))

    const senderATA = await getAssociatedTokenAddress(mint, sender)
    const recipientATA = await getAssociatedTokenAddress(mint, recipient)
    const escrowATA = await getAssociatedTokenAddress(mint, escrowPDA, true)

    const accounts: AccountMeta[] = [
      { pubkey: publicKey, isSigner: true, isWritable: true },
      { pubkey: sender, isSigner: false, isWritable: false },
      { pubkey: recipient, isSigner: false, isWritable: false },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: senderATA, isSigner: false, isWritable: true },
      { pubkey: recipientATA, isSigner: false, isWritable: true },
      { pubkey: escrowATA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const data = Buffer.from([2]) // Cancel instruction discriminator

    return new TransactionInstruction({
      keys: accounts,
      programId: STREAMFLOW_PROGRAM_ID,
      data
    })
  }, [publicKey, connection, getEscrowPDA])

  // Topup stream instruction
  const topupStreamInstruction = useCallback(async (params: TopupParams) => {
    if (!publicKey) throw new Error('Wallet not connected')

    const streamPDA = new PublicKey(params.streamId)
    const escrowPDA = getEscrowPDA(streamPDA)

    const streamAccount = await connection.getAccountInfo(streamPDA)
    if (!streamAccount) throw new Error('Stream not found')

    const mint = new PublicKey(streamAccount.data.slice(40, 72))
    const senderATA = await getAssociatedTokenAddress(mint, publicKey)
    const escrowATA = await getAssociatedTokenAddress(mint, escrowPDA, true)

    const accounts: AccountMeta[] = [
      { pubkey: publicKey, isSigner: true, isWritable: true },
      { pubkey: streamPDA, isSigner: false, isWritable: true },
      { pubkey: escrowPDA, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: senderATA, isSigner: false, isWritable: true },
      { pubkey: escrowATA, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ]

    const amountBN = new BN(params.amount * LAMPORTS_PER_SOL)
    const data = Buffer.concat([
      Buffer.from([3]), // Topup instruction discriminator
      amountBN.toArrayLike(Buffer, 'le', 8)
    ])

    return new TransactionInstruction({
      keys: accounts,
      programId: STREAMFLOW_PROGRAM_ID,
      data
    })
  }, [publicKey, connection, getEscrowPDA])

  // Create stream
  const createStream = useCallback(async (params: CreateStreamParams) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    try {
      const instruction = await createStreamInstruction(params)
      const transaction = new Transaction().add(instruction)

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Stream created successfully!')
      return signature
    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream')
      throw error
    } finally {
      setLoading(false)
    }
  }, [publicKey, sendTransaction, connection, createStreamInstruction])

  // Withdraw from stream
  const withdrawFromStream = useCallback(async (params: WithdrawParams) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    try {
      const instruction = await withdrawInstruction(params)
      const transaction = new Transaction().add(instruction)

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Withdrawal successful!')
      return signature
    } catch (error) {
      console.error('Error withdrawing from stream:', error)
      toast.error('Failed to withdraw from stream')
      throw error
    } finally {
      setLoading(false)
    }
  }, [publicKey, sendTransaction, connection, withdrawInstruction])

  // Cancel stream
  const cancelStream = useCallback(async (streamId: string) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    setLoading(true)
    try {
      const instruction = await cancelStreamInstruction(streamId)
      const transaction = new Transaction().add(instruction)

      const signature = await sendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Stream canceled successfully!')
      return signature
    } catch (error) {
      console.error('Error canceling stream:', error)
      toast.error('Failed to cancel stream')
      throw error
    } finally {
      setLoading(false)
    }
  }, [publicKey, sendTransaction, connection, cancelStreamInstruction])

  // Topup stream
  const topupStream = useCallback(async (params: TopupParams) => {
    if (!publicKey || !sendTransaction) {
      throw new Error('Wallet not connected')
    }

    set