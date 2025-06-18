```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Clock, 
  DollarSign, 
  User, 
  Calendar, 
  TrendingUp, 
  Pause, 
  Play, 
  Square, 
  MoreVertical,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface StreamData {
  id: string
  title: string
  recipient: string
  recipientAvatar?: string
  sender: string
  senderAvatar?: string
  tokenSymbol: string
  tokenIcon?: string
  totalAmount: number
  streamedAmount: number
  remainingAmount: number
  startDate: Date
  endDate: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  streamRate: number
  cliffDate?: Date
  isRevocable: boolean
  lastWithdrawal?: Date
}

interface StreamCardProps {
  stream: StreamData
  onPause?: (streamId: string) => void
  onResume?: (streamId: string) => void
  onCancel?: (streamId: string) => void
  onWithdraw?: (streamId: string) => void
  isRecipient?: boolean
}

export default function StreamCard({ 
  stream, 
  onPause, 
  onResume, 
  onCancel, 
  onWithdraw,
  isRecipient = false 
}: StreamCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [copied, setCopied] = useState(false)

  const progressPercentage = (stream.streamedAmount / stream.totalAmount) * 100
  const timeRemaining = formatDistanceToNow(stream.endDate, { addSuffix: true })
  const isActive = stream.status === 'active'
  const isPaused = stream.status === 'paused'
  const isCompleted = stream.status === 'completed'
  const isCancelled = stream.status === 'cancelled'

  const getStatusColor = () => {
    switch (stream.status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount)
  }

  return (
    <Card className="group relative overflow-hidden border border-slate-800/50 bg-slate-900/50 backdrop-blur-sm hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 border border-slate-700">
              <AvatarImage src={isRecipient ? stream.senderAvatar : stream.recipientAvatar} />
              <AvatarFallback className="bg-slate-800 text-slate-300">
                {isRecipient ? stream.sender.slice(0, 2).toUpperCase() : stream.recipient.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-slate-100 text-lg font-semibold">
                {stream.title}
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <User className="h-3 w-3" />
                <span>
                  {isRecipient ? 'From' : 'To'}: {(isRecipient ? stream.sender : stream.recipient).slice(0, 8)}...
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-slate-800"
                  onClick={() => copyToClipboard(isRecipient ? stream.sender : stream.recipient)}
                >
                  {copied ? <CheckCircle className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={`${getStatusColor()} border`}>
              {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-800">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                <DropdownMenuItem onClick={() => setShowDetails(true)} className="hover:bg-slate-800">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                {isRecipient && stream.streamedAmount > 0 && (
                  <DropdownMenuItem onClick={() => onWithdraw?.(stream.id)} className="hover:bg-slate-800">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Withdraw
                  </DropdownMenuItem>
                )}
                {!isRecipient && isActive && (
                  <DropdownMenuItem onClick={() => onPause?.(stream.id)} className="hover:bg-slate-800">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause Stream
                  </DropdownMenuItem>
                )}
                {!isRecipient && isPaused && (
                  <DropdownMenuItem onClick={() => onResume?.(stream.id)} className="hover:bg-slate-800">
                    <Play className="mr-2 h-4 w-4" />
                    Resume Stream
                  </DropdownMenuItem>
                )}
                {!isRecipient && stream.isRevocable && (isActive || isPaused) && (
                  <DropdownMenuItem 
                    onClick={() => onCancel?.(stream.id)} 
                    className="hover:bg-red-900/20 text-red-400"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Cancel Stream
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <DollarSign className="h-4 w-4" />
              <span>Total Amount</span>
            </div>
            <div className="text-xl font-bold text-slate-100">
              {formatAmount(stream.totalAmount)} {stream.tokenSymbol}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <TrendingUp className="h-4 w-4" />
              <span>Streamed</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {formatAmount(stream.streamedAmount)} {stream.tokenSymbol}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300 font-medium">{progressPercentage.toFixed(1)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>Start Date</span>
            </div>
            <div className="text-slate-300 font-medium">
              {format(stream.startDate, 'MMM dd, yyyy')}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-400">
              <Clock className="h-3 w-3" />
              <span>End Date</span>
            </div>
            <div className="text-slate-300 font-medium">
              {format(stream.endDate, 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        {!isCompleted && !isCancelled && (
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Time Remaining</span>
              <span className="text-slate-300 font-medium">{timeRemaining}</span>
            </div>
          </div>
        )}

        {isRecipient && stream.streamedAmount > 0 && (
          <Button 
            onClick={() => onWithdraw?.(stream.id)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Withdraw Available Funds
          </Button>
        )}
      </CardContent>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Stream Details</DialogTitle>
            <DialogDescription className="text-slate-400">
              Complete information about this payment stream
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Stream ID</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {stream.id.slice(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(stream.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-400">Sender</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {stream.sender.slice(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(stream.sender)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-400">Recipient</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="text-sm bg-slate-800 px-2 py-1 rounded text-slate-300">
                      {stream.recipient.slice(0, 16)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(stream.recipient)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Stream Rate</label>
                  <p className="text-slate-300 mt-1">
                    {formatAmount(stream.streamRate)} {stream.tokenSymbol}/sec
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-400">Remaining Amount