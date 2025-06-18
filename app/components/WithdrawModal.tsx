```tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { toast } from 'sonner'
import { Loader2, ArrowDownLeft, Clock, DollarSign, AlertTriangle } from 'lucide-react'

interface Stream {
  id: string
  recipient: string
  sender: string
  tokenMint: string
  tokenSymbol: string
  totalAmount: number
  withdrawnAmount: number
  startTime: number
  endTime: number
  cliffTime?: number
  isActive: boolean
  withdrawableAmount: number
}

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  stream: Stream | null
  onWithdrawSuccess: () => void
}

export default function WithdrawModal({ isOpen, onClose, stream, onWithdrawSuccess }: WithdrawModalProps) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [maxWithdrawable, setMaxWithdrawable] = useState(0)

  useEffect(() => {
    if (stream) {
      setMaxWithdrawable(stream.withdrawableAmount)
      setWithdrawAmount('')
    }
  }, [stream])

  const calculateWithdrawableAmount = () => {
    if (!stream) return 0
    
    const now = Date.now() / 1000
    const startTime = stream.startTime
    const endTime = stream.endTime
    const cliffTime = stream.cliffTime || startTime
    
    if (now < cliffTime) return 0
    if (now >= endTime) return stream.totalAmount - stream.withdrawnAmount
    
    const elapsed = now - startTime
    const duration = endTime - startTime
    const vestedAmount = (stream.totalAmount * elapsed) / duration
    
    return Math.max(0, vestedAmount - stream.withdrawnAmount)
  }

  const handleWithdraw = async () => {
    if (!publicKey || !signTransaction || !stream) {
      toast.error('Wallet not connected')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amount > maxWithdrawable) {
      toast.error('Amount exceeds withdrawable balance')
      return
    }

    setIsWithdrawing(true)

    try {
      // Create withdrawal transaction
      const transaction = new Transaction()
      
      // Add withdrawal instruction (this would be replaced with actual program instruction)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(stream.sender),
          toPubkey: publicKey,
          lamports: amount * 1e9, // Convert to lamports
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      const signedTransaction = await signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())
      
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success(`Successfully withdrew ${amount} ${stream.tokenSymbol}`)
      onWithdrawSuccess()
      onClose()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleMaxClick = () => {
    setWithdrawAmount(maxWithdrawable.toString())
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeRemaining = () => {
    if (!stream) return ''
    
    const now = Date.now() / 1000
    const endTime = stream.endTime
    
    if (now >= endTime) return 'Stream completed'
    
    const remaining = endTime - now
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    
    if (days > 0) return `${days}d ${hours}h remaining`
    return `${hours}h remaining`
  }

  if (!stream) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/95 backdrop-blur-xl border border-slate-800/50 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
            Withdraw from Stream
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stream Info Card */}
          <Card className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">{stream.tokenSymbol}</span>
                </div>
                <Badge 
                  variant={stream.isActive ? "default" : "secondary"}
                  className={stream.isActive 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-600/20 text-slate-400 border-slate-600/30"
                  }
                >
                  {stream.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-slate-400">Total Amount</Label>
                  <p className="font-medium">{stream.totalAmount.toLocaleString()} {stream.tokenSymbol}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Withdrawn</Label>
                  <p className="font-medium">{stream.withdrawnAmount.toLocaleString()} {stream.tokenSymbol}</p>
                </div>
              </div>

              <Separator className="bg-slate-700/50" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Start Time:</span>
                  <span>{formatTime(stream.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">End Time:</span>
                  <span>{formatTime(stream.endTime)}</span>
                </div>
                {stream.cliffTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cliff Time:</span>
                    <span>{formatTime(stream.cliffTime)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span className="text-slate-300">{getTimeRemaining()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Withdrawable Amount */}
          <Card className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 backdrop-blur-sm border border-emerald-500/20">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <Label className="text-slate-400">Available to Withdraw</Label>
                <div className="text-2xl font-bold text-emerald-400">
                  {maxWithdrawable.toLocaleString()} {stream.tokenSymbol}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Withdraw Form */}
          {maxWithdrawable > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Withdraw Amount</Label>
                <div className="relative">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50 text-slate-100 pr-16"
                    max={maxWithdrawable}
                    step="0.000001"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxClick}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium"
                >
                  {isWithdrawing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-400">No funds available</p>
                    <p className="text-slate-300 mt-1">
                      {Date.now() / 1000 < (stream.cliffTime || stream.startTime)
                        ? 'Cliff period has not ended yet'
                        : 'All available funds have been withdrawn'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```