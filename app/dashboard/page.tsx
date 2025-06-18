```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, TrendingUp, Lock, Users, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface StreamData {
  id: string
  recipient: string
  amount: number
  token: string
  startTime: Date
  endTime: Date
  claimed: number
  status: 'active' | 'completed' | 'cancelled'
  type: 'vesting' | 'streaming'
}

interface DashboardStats {
  totalStreams: number
  activeStreams: number
  totalValue: number
  claimedValue: number
}

export default function DashboardPage() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [streams, setStreams] = useState<StreamData[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalStreams: 0,
    activeStreams: 0,
    totalValue: 0,
    claimedValue: 0
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [loading, setLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    if (connected && publicKey) {
      const mockStreams: StreamData[] = [
        {
          id: '1',
          recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          amount: 10000,
          token: 'USDC',
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-12-31'),
          claimed: 3500,
          status: 'active',
          type: 'vesting'
        },
        {
          id: '2',
          recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          amount: 5000,
          token: 'SOL',
          startTime: new Date('2024-02-01'),
          endTime: new Date('2024-08-01'),
          claimed: 4200,
          status: 'active',
          type: 'streaming'
        },
        {
          id: '3',
          recipient: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi',
          amount: 25000,
          token: 'USDT',
          startTime: new Date('2023-06-01'),
          endTime: new Date('2024-01-01'),
          claimed: 25000,
          status: 'completed',
          type: 'vesting'
        }
      ]
      
      setStreams(mockStreams)
      setStats({
        totalStreams: mockStreams.length,
        activeStreams: mockStreams.filter(s => s.status === 'active').length,
        totalValue: mockStreams.reduce((acc, s) => acc + s.amount, 0),
        claimedValue: mockStreams.reduce((acc, s) => acc + s.claimed, 0)
      })
    }
  }, [connected, publicKey])

  const handleCreateStream = async () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setIsCreateDialogOpen(false)
    }, 2000)
  }

  const getProgressPercentage = (stream: StreamData) => {
    const now = new Date()
    const total = stream.endTime.getTime() - stream.startTime.getTime()
    const elapsed = now.getTime() - stream.startTime.getTime()
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  const getClaimableAmount = (stream: StreamData) => {
    const progress = getProgressPercentage(stream)
    const claimable = (stream.amount * progress / 100) - stream.claimed
    return Math.max(claimable, 0)
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-100">Connect Your Wallet</CardTitle>
            <CardDescription className="text-slate-400">
              Please connect your Solana wallet to access the dashboard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Dashboard</h1>
            <p className="text-slate-400 mt-1">Manage your token streams and vesting schedules</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 transition-all duration-200 hover:scale-105">
                <Plus className="w-4 h-4 mr-2" />
                Create Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800/95 backdrop-blur-sm border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Create New Stream</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Set up a new token stream or vesting schedule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <Input
                      id="recipient"
                      placeholder="Enter Solana address"
                      className="bg-slate-700/50 border-slate-600 text-slate-100 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token">Token</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="sol">SOL</SelectItem>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      className="bg-slate-700/50 border-slate-600 text-slate-100 focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Stream Type</Label>
                    <Select>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="streaming">Streaming</SelectItem>
                        <SelectItem value="vesting">Vesting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600 text-slate-100 hover:bg-slate-600/50",
                            !selectedDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="text-slate-100"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-slate-700/50 border-slate-600 text-slate-100 hover:bg-slate-600/50",
                            !endDate && "text-slate-400"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="text-slate-100"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <Button 
                  onClick={handleCreateStream}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                >
                  {loading ? 'Creating...' : 'Create Stream'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Streams</CardTitle>
              <Lock className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.totalStreams}</div>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Streams</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.activeStreams}</div>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">${stats.totalValue.toLocaleString()}</div>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +15% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration