```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, Clock, DollarSign, Users, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { format, addDays, addMonths, addYears } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface StreamTemplate {
  id: string
  name: string
  description: string
  duration: string
  frequency: string
  category: 'salary' | 'vesting' | 'investment' | 'custom'
}

interface StreamFormData {
  recipient: string
  amount: string
  token: string
  startDate: Date
  endDate: Date
  frequency: 'linear' | 'monthly' | 'weekly' | 'daily'
  cliffDate?: Date
  title: string
  description: string
  cancelable: boolean
  transferable: boolean
}

const streamTemplates: StreamTemplate[] = [
  {
    id: 'salary',
    name: 'Employee Salary',
    description: 'Monthly salary payments with linear streaming',
    duration: '12 months',
    frequency: 'linear',
    category: 'salary'
  },
  {
    id: 'vesting',
    name: 'Token Vesting',
    description: 'Token vesting with cliff period',
    duration: '48 months',
    frequency: 'monthly',
    category: 'vesting'
  },
  {
    id: 'investment',
    name: 'Investment Payout',
    description: 'Quarterly investment returns',
    duration: '24 months',
    frequency: 'monthly',
    category: 'investment'
  }
]

const tokenOptions = [
  { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112' },
  { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', name: 'Tether USD', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' }
]

export default function StreamCreator() {
  const { publicKey, connected, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<StreamTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<StreamFormData>({
    recipient: '',
    amount: '',
    token: 'SOL',
    startDate: new Date(),
    endDate: addMonths(new Date(), 12),
    frequency: 'linear',
    title: '',
    description: '',
    cancelable: true,
    transferable: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance()
    }
  }, [connected, publicKey])

  const fetchBalance = async () => {
    if (!publicKey) return
    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / LAMPORTS_PER_SOL)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required'
    } else {
      try {
        new PublicKey(formData.recipient)
      } catch {
        newErrors.recipient = 'Invalid Solana address'
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0'
    }

    if (parseFloat(formData.amount) > balance && formData.token === 'SOL') {
      newErrors.amount = 'Insufficient balance'
    }

    if (!formData.title) {
      newErrors.title = 'Stream title is required'
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.cliffDate && formData.cliffDate <= formData.startDate) {
      newErrors.cliffDate = 'Cliff date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTemplateSelect = (template: StreamTemplate) => {
    setSelectedTemplate(template)
    setFormData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      frequency: template.frequency as any,
      endDate: template.duration === '12 months' 
        ? addMonths(prev.startDate, 12)
        : template.duration === '24 months'
        ? addMonths(prev.startDate, 24)
        : addMonths(prev.startDate, 48),
      cliffDate: template.category === 'vesting' ? addMonths(prev.startDate, 12) : undefined
    }))
  }

  const calculateStreamDetails = () => {
    const amount = parseFloat(formData.amount) || 0
    const startTime = formData.startDate.getTime()
    const endTime = formData.endDate.getTime()
    const duration = endTime - startTime
    const durationDays = Math.ceil(duration / (1000 * 60 * 60 * 24))
    
    let releaseRate = 0
    let nextRelease = new Date()

    switch (formData.frequency) {
      case 'linear':
        releaseRate = amount / (duration / (1000 * 60 * 60 * 24))
        nextRelease = new Date(Date.now() + 24 * 60 * 60 * 1000)
        break
      case 'daily':
        releaseRate = amount / durationDays
        nextRelease = new Date(Date.now() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        releaseRate = amount / (durationDays / 7)
        nextRelease = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        releaseRate = amount / (durationDays / 30)
        nextRelease = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        break
    }

    return {
      totalAmount: amount,
      duration: durationDays,
      releaseRate: releaseRate.toFixed(6),
      nextRelease,
      frequency: formData.frequency
    }
  }

  const handleCreateStream = async () => {
    if (!connected || !publicKey || !signTransaction) {
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
      
      // Add stream creation instruction (placeholder - would use actual program)
      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(formData.recipient),
        lamports: Math.floor(parseFloat(formData.amount) * LAMPORTS_PER_SOL * 0.01) // 1% as deposit
      })

      transaction.add(instruction)

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Stream created successfully!')
      
      // Reset form
      setFormData({
        recipient: '',
        amount: '',
        token: 'SOL',
        startDate: new Date(),
        endDate: addMonths(new Date(), 12),
        frequency: 'linear',
        title: '',
        description: '',
        cancelable: true,
        transferable: false
      })
      setSelectedTemplate(null)
      setShowPreview(false)

    } catch (error) {
      console.error('Error creating stream:', error)
      toast.error('Failed to create stream')
    } finally {
      setIsLoading(false)
    }
  }

  const streamDetails = calculateStreamDetails()

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-100">Create New Stream</h1>
          <p className="text-slate-400 text-lg">Set up automated token streaming for payments, vesting, or investments</p>
        </div>

        {/* Templates */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Quick Templates
            </CardTitle>
            <CardDescription className="text-slate-400">
              Choose a pre-configured template to get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {streamTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:scale-105",
                    "bg-slate-700/30 border-slate-600/50 hover:border-indigo-500/50",
                    selectedTemplate?.id === template.id && "border-indigo-500 bg-indigo-500/10"
                  )}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-100">{template.name}</h3>
                        <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">{template.description}</p>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>{template.duration}</span>
                        <span>•</span>
                        <span>{template.frequency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-100">Stream Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure the details of your payment stream
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-200">Stream Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Monthly Salary Payment"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
                    />
                    {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-slate-200">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Solana wallet address"
                      value={formData.recipient}
                      onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
                    />
                    {errors.recipient && <p className="text-red-400 text-sm">{errors.recipient}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-200">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about this stream..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400"
                    rows={3}
                  />
                </div>

                <Separator className="bg-slate-700" />

                {/* Token & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y