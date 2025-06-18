```tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Calendar, Clock, DollarSign, Users, Play, Pause, Settings, Download, Share2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface StreamData {
  id: string
  name: string
  description: string
  tokenMint: string
  tokenSymbol: string
  tokenDecimals: number
  sender: string
  recipient: string
  totalAmount: number
  withdrawnAmount: number
  startTime: number
  endTime: number
  cliffTime?: number
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  streamType: 'linear' | 'cliff' | 'unlock'
  createdAt: number
  lastWithdrawal?: number
  withdrawalFrequency: number
  canCancel: boolean
  canPause: boolean
  canTransfer: boolean
}

interface WithdrawalHistory {
  timestamp: number
  amount: number
  signature: string
}

export default function StreamDetailPage() {
  const params = useParams()
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [stream, setStream] = useState<StreamData | null>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [newRecipient, setNewRecipient] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [availableAmount, setAvailableAmount] = useState(0)

  const streamId = params.id as string

  useEffect(() => {
    if (streamId) {
      fetchStreamData()
      fetchWithdrawalHistory()
    }
  }, [streamId, connected])

  useEffect(() => {
    if (stream) {
      calculateAvailableAmount()
      const interval = setInterval(calculateAvailableAmount, 1000)
      return () => clearInterval(interval)
    }
  }, [stream])

  const fetchStreamData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual Solana program call
      const mockStream: StreamData = {
        id: streamId,
        name: 'Team Vesting Stream',
        description: 'Monthly vesting for core team members with 6-month cliff period',
        tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenSymbol: 'USDC',
        tokenDecimals: 6,
        sender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        recipient: publicKey?.toString() || '',
        totalAmount: 120000,
        withdrawnAmount: 25000,
        startTime: Date.now() - 86400000 * 30,
        endTime: Date.now() + 86400000 * 335,
        cliffTime: Date.now() - 86400000 * 150,
        status: 'active',
        streamType: 'cliff',
        createdAt: Date.now() - 86400000 * 180,
        lastWithdrawal: Date.now() - 86400000 * 7,
        withdrawalFrequency: 86400000 * 30,
        canCancel: true,
        canPause: true,
        canTransfer: true
      }
      setStream(mockStream)
    } catch (error) {
      console.error('Error fetching stream:', error)
      toast({
        title: 'Error',
        description: 'Failed to load stream data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWithdrawalHistory = async () => {
    try {
      // Mock data - replace with actual transaction history
      const mockHistory: WithdrawalHistory[] = [
        {
          timestamp: Date.now() - 86400000 * 7,
          amount: 10000,
          signature: '5j7s8K9mN2pQ3rT4uV5wX6yZ7aB8cD9eF0gH1iJ2kL3mN4oP5qR6sT7uV8wX9yZ0'
        },
        {
          timestamp: Date.now() - 86400000 * 37,
          amount: 15000,
          signature: '2a3B4c5D6e7F8g9H0i1J2k3L4m5N6o7P8q9R0s1T2u3V4w5X6y7Z8a9B0c1D2e3F'
        }
      ]
      setWithdrawalHistory(mockHistory)
    } catch (error) {
      console.error('Error fetching withdrawal history:', error)
    }
  }

  const calculateAvailableAmount = () => {
    if (!stream) return

    const now = Date.now()
    const { startTime, endTime, cliffTime, totalAmount, withdrawnAmount, streamType } = stream

    if (now < startTime) {
      setAvailableAmount(0)
      return
    }

    if (streamType === 'cliff' && cliffTime && now < cliffTime) {
      setAvailableAmount(0)
      return
    }

    if (now >= endTime) {
      setAvailableAmount(totalAmount - withdrawnAmount)
      return
    }

    const elapsed = now - startTime
    const duration = endTime - startTime
    const vestedAmount = (totalAmount * elapsed) / duration
    const available = Math.max(0, vestedAmount - withdrawnAmount)
    
    setAvailableAmount(Math.floor(available))
  }

  const handleWithdraw = async () => {
    if (!connected || !publicKey || !stream) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect your wallet to withdraw',
        variant: 'destructive'
      })
      return
    }

    try {
      setWithdrawing(true)
      
      // Mock withdrawal - replace with actual Solana program call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStream(prev => prev ? {
        ...prev,
        withdrawnAmount: prev.withdrawnAmount + availableAmount,
        lastWithdrawal: Date.now()
      } : null)

      setWithdrawalHistory(prev => [{
        timestamp: Date.now(),
        amount: availableAmount,
        signature: 'mock_signature_' + Date.now()
      }, ...prev])

      toast({
        title: 'Withdrawal successful',
        description: `Withdrew ${(availableAmount / Math.pow(10, stream.tokenDecimals)).toLocaleString()} ${stream.tokenSymbol}`
      })
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast({
        title: 'Withdrawal failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setWithdrawing(false)
    }
  }

  const handlePauseResume = async () => {
    if (!connected || !publicKey || !stream) return

    try {
      setPausing(true)
      
      // Mock pause/resume - replace with actual Solana program call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setStream(prev => prev ? {
        ...prev,
        status: prev.status === 'active' ? 'paused' : 'active'
      } : null)

      toast({
        title: stream.status === 'active' ? 'Stream paused' : 'Stream resumed',
        description: stream.status === 'active' ? 'Stream has been paused' : 'Stream has been resumed'
      })
    } catch (error) {
      console.error('Pause/resume error:', error)
      toast({
        title: 'Operation failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setPausing(false)
    }
  }

  const handleTransfer = async () => {
    if (!connected || !publicKey || !stream || !newRecipient) return

    try {
      setTransferring(true)
      
      // Validate recipient address
      new PublicKey(newRecipient)
      
      // Mock transfer - replace with actual Solana program call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStream(prev => prev ? {
        ...prev,
        recipient: newRecipient
      } : null)

      setShowTransferDialog(false)
      setNewRecipient('')
      
      toast({
        title: 'Stream transferred',
        description: 'Stream ownership has been transferred successfully'
      })
    } catch (error) {
      console.error('Transfer error:', error)
      toast({
        title: 'Transfer failed',
        description: 'Invalid recipient address or transaction failed',
        variant: 'destructive'
      })
    } finally {
      setTransferring(false)
    }
  }

  const handleCancel = async () => {
    if (!connected || !publicKey || !stream) return

    try {
      setCancelling(true)
      
      // Mock cancellation - replace with actual Solana program call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setStream(prev => prev ? {
        ...prev,
        status: 'cancelled'
      } : null)

      setShowCancelDialog(false)
      setCancelReason('')
      
      toast({
        title: 'Stream cancelled',
        description: 'Stream has been cancelled successfully'
      })
    } catch (error) {
      console.error('Cancel error:', error)
      toast({
        title: 'Cancellation failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setCancelling(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, decimals: number) => {
    return (amount / Math.pow(10, decimals)).toLocaleString()
  }

  const getProgressPercentage = () => {
    if (!stream) return 0
    return Math.min(100, (stream.withdrawnAmount / stream.totalAmount) * 100)
  }

  const getTimeProgressPercentage = () => {
    if (!stream) return 0
    const now = Date.now()
    const { startTime, endTime } = stream
    if (now <= startTime) return 0
    if (now >= endTime) return 100
    return ((now - startTime) / (endTime - startTime)) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded-xl w-64"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-96 bg-slate-800 rounded-xl"></div>
                <div className="h-64 bg-slate-800 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-slate-800 rounded-xl"></div>
                <div className="h-32 bg-slate-800 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-100 mb-2">Stream Not Found</h1>
            <p className="text-slate-400 mb-6">The requested stream could not be found or does not exist.</p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboar