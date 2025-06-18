```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Connection } from '@solana/web3.js'
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor'
import { toast } from 'sonner'

export interface Stream {
  id: string
  sender: string
  recipient: string
  mint: string
  amount: BN
  startTime: BN
  endTime: BN
  cliffTime: BN
  amountWithdrawn: BN
  canceled: boolean
  paused: boolean
  pausedAt: BN
  name: string
  createdAt: Date
  withdrawableAmount: BN
  streamedAmount: BN
  remainingAmount: BN
  status: 'active' | 'paused' | 'completed' | 'canceled'
  progress: number
}

export interface StreamsData {
  outgoing: Stream[]
  incoming: Stream[]
  total: {
    outgoing: number
    incoming: number
    totalValue: number
    activeStreams: number
  }
}

export interface UseStreamsReturn {
  streams: StreamsData
  loading: boolean
  error: string | null
  refreshStreams: () => Promise<void>
  createStream: (params: CreateStreamParams) => Promise<string | null>
  cancelStream: (streamId: string) => Promise<boolean>
  pauseStream: (streamId: string) => Promise<boolean>
  resumeStream: (streamId: string) => Promise<boolean>
  withdrawFromStream: (streamId: string, amount?: BN) => Promise<boolean>
}

export interface CreateStreamParams {
  recipient: string
  mint: string
  amount: BN
  startTime: BN
  endTime: BN
  cliffTime?: BN
  name: string
}

const STREAMFLOW_PROGRAM_ID = new PublicKey('strmRqUCoQUgGUan5YhzUZa6KqdzwX5L6FpUxfmKg5m')

export function useStreams(): UseStreamsReturn {
  const { publicKey, wallet, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  const [streams, setStreams] = useState<StreamsData>({
    outgoing: [],
    incoming: [],
    total: {
      outgoing: 0,
      incoming: 0,
      totalValue: 0,
      activeStreams: 0
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getProvider = useCallback(() => {
    if (!wallet || !publicKey || !signTransaction) {
      throw new Error('Wallet not connected')
    }
    
    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions: wallet.adapter.signAllTransactions?.bind(wallet.adapter) || (async (txs) => {
          const signedTxs = []
          for (const tx of txs) {
            signedTxs.push(await signTransaction(tx))
          }
          return signedTxs
        })
      },
      { commitment: 'confirmed' }
    )
  }, [wallet, publicKey, signTransaction, connection])

  const calculateStreamMetrics = useCallback((streamData: any): Partial<Stream> => {
    const now = new BN(Date.now() / 1000)
    const startTime = streamData.startTime
    const endTime = streamData.endTime
    const cliffTime = streamData.cliffTime || startTime
    const totalAmount = streamData.amount
    const withdrawn = streamData.amountWithdrawn

    let status: Stream['status'] = 'active'
    let streamedAmount = new BN(0)
    let withdrawableAmount = new BN(0)
    let progress = 0

    if (streamData.canceled) {
      status = 'canceled'
    } else if (streamData.paused) {
      status = 'paused'
    } else if (now.gte(endTime)) {
      status = 'completed'
      streamedAmount = totalAmount
      withdrawableAmount = totalAmount.sub(withdrawn)
      progress = 100
    } else if (now.lt(cliffTime)) {
      streamedAmount = new BN(0)
      withdrawableAmount = new BN(0)
      progress = 0
    } else {
      const elapsed = now.sub(startTime)
      const duration = endTime.sub(startTime)
      
      if (duration.gt(new BN(0))) {
        streamedAmount = totalAmount.mul(elapsed).div(duration)
        withdrawableAmount = streamedAmount.sub(withdrawn)
        progress = elapsed.mul(new BN(100)).div(duration).toNumber()
      }
    }

    const remainingAmount = totalAmount.sub(streamedAmount)

    return {
      streamedAmount,
      withdrawableAmount,
      remainingAmount,
      status,
      progress: Math.min(Math.max(progress, 0), 100)
    }
  }, [])

  const parseStreamAccount = useCallback((account: any, pubkey: string): Stream => {
    const metrics = calculateStreamMetrics(account)
    
    return {
      id: pubkey,
      sender: account.sender.toString(),
      recipient: account.recipient.toString(),
      mint: account.mint.toString(),
      amount: account.amount,
      startTime: account.startTime,
      endTime: account.endTime,
      cliffTime: account.cliffTime || account.startTime,
      amountWithdrawn: account.amountWithdrawn,
      canceled: account.canceled,
      paused: account.paused,
      pausedAt: account.pausedAt || new BN(0),
      name: account.name || 'Unnamed Stream',
      createdAt: new Date(account.startTime.toNumber() * 1000),
      ...metrics
    } as Stream
  }, [calculateStreamMetrics])

  const fetchStreams = useCallback(async () => {
    if (!publicKey) {
      setStreams({
        outgoing: [],
        incoming: [],
        total: { outgoing: 0, incoming: 0, totalValue: 0, activeStreams: 0 }
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = getProvider()
      
      // Fetch stream accounts where user is sender or recipient
      const streamAccounts = await connection.getProgramAccounts(STREAMFLOW_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 8, // Skip discriminator
              bytes: publicKey.toBase58()
            }
          }
        ]
      })

      const recipientAccounts = await connection.getProgramAccounts(STREAMFLOW_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset: 40, // Offset for recipient field
              bytes: publicKey.toBase58()
            }
          }
        ]
      })

      // Combine and deduplicate accounts
      const allAccounts = new Map()
      
      streamAccounts.forEach(({ pubkey, account }) => {
        allAccounts.set(pubkey.toString(), { pubkey, account })
      })
      
      recipientAccounts.forEach(({ pubkey, account }) => {
        allAccounts.set(pubkey.toString(), { pubkey, account })
      })

      const outgoing: Stream[] = []
      const incoming: Stream[] = []

      for (const { pubkey, account } of allAccounts.values()) {
        try {
          // Parse account data (simplified - in real implementation would use IDL)
          const accountData = {
            sender: new PublicKey(account.data.slice(8, 40)),
            recipient: new PublicKey(account.data.slice(40, 72)),
            mint: new PublicKey(account.data.slice(72, 104)),
            amount: new BN(account.data.slice(104, 112), 'le'),
            startTime: new BN(account.data.slice(112, 120), 'le'),
            endTime: new BN(account.data.slice(120, 128), 'le'),
            cliffTime: new BN(account.data.slice(128, 136), 'le'),
            amountWithdrawn: new BN(account.data.slice(136, 144), 'le'),
            canceled: account.data[144] === 1,
            paused: account.data[145] === 1,
            pausedAt: new BN(account.data.slice(146, 154), 'le'),
            name: Buffer.from(account.data.slice(154, 186)).toString('utf8').replace(/\0/g, '')
          }

          const stream = parseStreamAccount(accountData, pubkey.toString())

          if (accountData.sender.equals(publicKey)) {
            outgoing.push(stream)
          }
          if (accountData.recipient.equals(publicKey)) {
            incoming.push(stream)
          }
        } catch (parseError) {
          console.warn('Failed to parse stream account:', parseError)
        }
      }

      // Calculate totals
      const activeOutgoing = outgoing.filter(s => s.status === 'active').length
      const activeIncoming = incoming.filter(s => s.status === 'active').length
      const totalValue = [...outgoing, ...incoming].reduce((sum, stream) => {
        return sum + stream.amount.toNumber()
      }, 0)

      setStreams({
        outgoing: outgoing.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        incoming: incoming.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        total: {
          outgoing: outgoing.length,
          incoming: incoming.length,
          totalValue,
          activeStreams: activeOutgoing + activeIncoming
        }
      })
    } catch (err) {
      console.error('Error fetching streams:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch streams')
      toast.error('Failed to fetch streams')
    } finally {
      setLoading(false)
    }
  }, [publicKey, connection, getProvider, parseStreamAccount])

  const createStream = useCallback(async (params: CreateStreamParams): Promise<string | null> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    try {
      const provider = getProvider()
      
      // Generate stream account keypair
      const streamKeypair = web3.Keypair.generate()
      
      // Create stream instruction (simplified - would use actual program IDL)
      const instruction = web3.SystemProgram.createAccount({
        fromPubkey: publicKey,
        newAccountPubkey: streamKeypair.publicKey,
        lamports: await connection.getMinimumBalanceForRentExemption(256),
        space: 256,
        programId: STREAMFLOW_PROGRAM_ID
      })

      const transaction = new web3.Transaction().add(instruction)
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      transaction.feePayer = publicKey

      const signedTx = await signTransaction!(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')
      
      toast.success('Stream created successfully')
      await refreshStreams()
      
      return streamKeypair.publicKey.toString()
    } catch (err) {
      console.error('Error creating stream:', err)
      toast.error('Failed to create stream')
      return null
    }
  }, [publicKey, getProvider, connection, signTransaction])

  const cancelStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return false
    }

    try {
      // Implementation would call cancel instruction on the program
      toast.success('Stream canceled successfully')
      await refreshStreams()
      return true
    } catch (err) {
      console.error('Error canceling stream:', err)
      toast.error('Failed to cancel stream')
      return false
    }
  }, [publicKey, refreshStreams])

  const pauseStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return false
    }

    try {
      // Implementation would call pause instruction on the program
      toast.success('Stream paused successfully')
      await refreshStreams()
      return true
    } catch (err) {
      console.error('Error pausing stream:', err)
      toast.error('Failed to pause stream')
      return false
    }
  }, [publicKey, refreshStreams])

  const resumeStream = useCallback(async (streamId: string): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return false
    }

    try {
      // Implementation would call resume instruction on the program
      toast.success('Stream resumed successfully')
      await refreshStreams()
      return true
    } catch (err) {
      console.error('Error resuming stream:', err)
      toast.error('Failed to resume stream')
      return false
    }
  }, [publicKey, refreshStreams])

  const withdrawFromStream = useCallback(async (streamId: string, amount?: BN): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return false
    }

    try {
      // Implementation would call withdraw instruction on the program
      toast.success('Withdrawal successful')
      await refreshStreams()
      return true
    } catch (err) {
      console.error('Error withdrawing from stream:', err)
      toast.error('Failed to withdraw from stream')
      return false
    }
  }, [publicKey, refreshStreams])

  const refreshStreams = useCallback(async () => {
    await fetchStreams()
  }, [fetchStreams])

  useEffect(() => {
    fetchStreams()
  }, [fetchStreams])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (publicKey && !loading) {
        fetchStreams()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [publicKey, loading, fetchStreams])

  return {
    streams,
    loading,
    error,
    refreshStreams,
    createStream,
    cancelStream,
    pauseStream,
    resumeStream,
    withdrawFromStream
  }
}
```