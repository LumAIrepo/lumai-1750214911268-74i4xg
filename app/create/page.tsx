```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, Clock, DollarSign, Users, Zap, ArrowLeft, Info } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

interface StreamConfig {
  recipient: string
  amount: string
  token: string
  startDate: Date | undefined
  endDate: Date | undefined
  streamType: 'linear' | 'cliff' | 'step'
  cliffAmount?: string
  cliffDate?: Date | undefined
  stepAmount?: string
  stepInterval?: string
  cancelable: boolean
  transferable: boolean
  description: string
}

const SUPPORTED_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
]

export default function CreateStreamPage() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<StreamConfig>({
    recipient: '',
    amount: '',
    token: 'SOL',
    startDate: undefined,
    endDate: undefined,
    streamType: 'linear',
    cancelable: true,
    transferable: false,
    description: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [estimatedFees, setEstimatedFees] = useState<number>(0)

  useEffect(() => {
    if (config.amount && config.startDate && config.endDate) {
      calculateEstimatedFees()
    }
  }, [config.amount, config.startDate, config.endDate, config.token])

  const calculateEstimatedFees = async () => {
    try {
      const rentExemption = await connection.getMinimumBalanceForRentExemption(1000)
      setEstimatedFees(rentExemption / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error calculating fees:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!config.recipient) {
      newErrors.recipient = 'Recipient address is required'
    } else {
      try {
        new PublicKey(config.recipient)
      } catch {
        newErrors.recipient = 'Invalid Solana address'
      }
    }

    if (!config.amount || parseFloat(config.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (!config.startDate) {
      newErrors.startDate = 'Start date is required'
    }

    if (!config.endDate) {
      newErrors.endDate = 'End date is required'
    }

    if (config.startDate && config.endDate && config.startDate >= config.endDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (config.streamType === 'cliff') {
      if (!config.cliffAmount || parseFloat(config.cliffAmount) <= 0) {
        newErrors.cliffAmount = 'Cliff amount is required'
      }
      if (!config.cliffDate) {
        newErrors.cliffDate = 'Cliff date is required'
      }
    }

    if (config.streamType === 'step') {
      if (!config.stepAmount || parseFloat(config.stepAmount) <= 0) {
        newErrors.stepAmount = 'Step amount is required'
      }
      if (!config.stepInterval) {
        newErrors.stepInterval = 'Step interval is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateStream = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    setIsLoading(true)

    try {
      // Create stream transaction
      const transaction = new Transaction()
      
      // Add create stream instruction (placeholder - would use actual program)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(config.recipient),
          lamports: Math.floor(parseFloat(config.amount) * LAMPORTS_PER_SOL)
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Stream created successfully!')
      
      // Reset form
      setConfig({
        recipient: '',
        amount: '',
        token: 'SOL',
        startDate: undefined,
        endDate: undefined,
        streamType: 'linear',
        cancelable: true,
        transferable: false,
        description: ''
      })

    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream')
    } finally {
      setIsLoading(false)
    }
  }

  const getDurationText = () => {
    if (!config.startDate || !config.endDate) return ''
    const diffTime = Math.abs(config.endDate.getTime() - config.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} days`
  }

  const getStreamRate = () => {
    if (!config.amount || !config.startDate || !config.endDate) return ''
    const amount = parseFloat(config.amount)
    const diffTime = Math.abs(config.endDate.getTime() - config.startDate.getTime())
    const diffHours = diffTime / (1000 * 60 * 60)
    const ratePerHour = amount / diffHours
    return `${ratePerHour.toFixed(6)} ${config.token}/hour`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-100">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Create New Stream
            </h1>
            <p className="text-slate-400 mt-1">Set up a new token stream with customizable parameters</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Configuration */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-400" />
                  Stream Configuration
                </CardTitle>
                <CardDescription>Configure the basic parameters for your token stream</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Solana wallet address"
                      value={config.recipient}
                      onChange={(e) => setConfig({ ...config, recipient: e.target.value })}
                      className={cn(
                        "bg-slate-800/50 border-slate-700 focus:border-indigo-500",
                        errors.recipient && "border-red-500"
                      )}
                    />
                    {errors.recipient && (
                      <p className="text-sm text-red-400">{errors.recipient}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select value={config.token} onValueChange={(value) => setConfig({ ...config, token: value })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {SUPPORTED_TOKENS.map((token) => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            {token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={config.amount}
                      onChange={(e) => setConfig({ ...config, amount: e.target.value })}
                      className={cn(
                        "bg-slate-800/50 border-slate-700 focus:border-indigo-500",
                        errors.amount && "border-red-500"
                      )}
                    />
                    {errors.amount && (
                      <p className="text-sm text-red-400">{errors.amount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="streamType">Stream Type</Label>
                    <Select value={config.streamType} onValueChange={(value: any) => setConfig({ ...config, streamType: value })}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="linear">Linear Vesting</SelectItem>
                        <SelectItem value="cliff">Cliff Vesting</SelectItem>
                        <SelectItem value="step">Step Vesting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-800/50 border-slate-700 hover:bg-slate-800",
                            !config.startDate && "text-slate-400",
                            errors.startDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {config.startDate ? format(config.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={config.startDate}
                          onSelect={(date) => setConfig({ ...config, startDate: date })}
                          initialFocus
                          className="bg-slate-800"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.startDate && (
                      <p className="text-sm text-red-400">{errors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-800/50 border-slate-700 hover:bg-slate-800",
                            !config.endDate && "text-slate-400",
                            errors.endDate && "border-red-500"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {config.endDate ? format(config.endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={config.endDate}
                          onSelect={(date) => setConfig({ ...config, endDate: date })}
                          initialFocus
                          className="bg-slate-800"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.endDate && (
                      <p className="text-sm