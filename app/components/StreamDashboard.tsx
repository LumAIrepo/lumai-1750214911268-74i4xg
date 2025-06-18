```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, Clock, DollarSign, TrendingUp, Users, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, Pause, Play, StopCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts'

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
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  streamRate: number
  createdAt: number
}

interface StreamStats {
  totalStreams: number
  activeStreams: number
  totalValueLocked: number
  totalWithdrawn: number
  monthlyVolume: number
  uniqueUsers: number
}

const mockStreams: Stream[] = [
  {
    id: '1',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    sender: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    totalAmount: 1000,
    withdrawnAmount: 350,
    startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 60 * 24 * 60 * 60 * 1000,
    status: 'active',
    streamRate: 0.0115,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000
  },
  {
    id: '2',
    recipient: '4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi',
    sender: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenSymbol: 'USDC',
    totalAmount: 50000,
    withdrawnAmount: 12500,
    startTime: Date.now() - 15 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 75 * 24 * 60 * 60 * 1000,
    cliffTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
    status: 'active',
    streamRate: 0.578,
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000
  },
  {
    id: '3',
    recipient: '8qbHbw2BbbTHBW1sbeqakYXVKRQM8Ne7pLK7m6CVfeR',
    sender: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    tokenMint: 'So11111111111111111111111111111111111111112',
    tokenSymbol: 'SOL',
    totalAmount: 500,
    withdrawnAmount: 500,
    startTime: Date.now() - 90 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    status: 'completed',
    streamRate: 0.0058,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000
  }
]

const mockStats: StreamStats = {
  totalStreams: 156,
  activeStreams: 89,
  totalValueLocked: 2450000,
  totalWithdrawn: 890000,
  monthlyVolume: 1200000,
  uniqueUsers: 1247
}

const chartData = [
  { name: 'Jan', value: 400000, withdrawn: 120000 },
  { name: 'Feb', value: 600000, withdrawn: 180000 },
  { name: 'Mar', value: 800000, withdrawn: 250000 },
  { name: 'Apr', value: 1200000, withdrawn: 380000 },
  { name: 'May', value: 1600000, withdrawn: 520000 },
  { name: 'Jun', value: 2100000, withdrawn: 680000 },
  { name: 'Jul', value: 2450000, withdrawn: 890000 }
]

export default function StreamDashboard() {
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()
  const [streams, setStreams] = useState<Stream[]>(mockStreams)
  const [stats, setStats] = useState<StreamStats>(mockStats)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null)

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || stream.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: number, symbol: string) => {
    return `${amount.toLocaleString()} ${symbol}`
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

  const getProgressPercentage = (stream: Stream) => {
    const now = Date.now()
    const totalDuration = stream.endTime - stream.startTime
    const elapsed = now - stream.startTime
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
  }

  const getWithdrawableAmount = (stream: Stream) => {
    const now = Date.now()
    if (now < stream.startTime) return 0
    if (stream.cliffTime && now < stream.cliffTime) return 0
    
    const elapsed = Math.min(now - stream.startTime, stream.endTime - stream.startTime)
    const totalDuration = stream.endTime - stream.startTime
    const vestedAmount = (elapsed / totalDuration) * stream.totalAmount
    return Math.max(vestedAmount - stream.withdrawnAmount, 0)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Stream Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage your token streams and vesting schedules</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl transition-all duration-200 hover:scale-105">
                <Plus className="w-4 h-4 mr-2" />
                Create Stream
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-slate-100">Create New Stream</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Recipient Address</label>
                    <Input 
                      placeholder="Enter recipient address"
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Token</label>
                    <Select>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-100 rounded-xl">
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        <SelectItem value="sol">SOL</SelectItem>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="usdt">USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Total Amount</label>
                    <Input 
                      type="number"
                      placeholder="0.00"
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Duration (days)</label>
                    <Input 
                      type="number"
                      placeholder="30"
                      className="bg-slate-800/50 border-slate-600/50 text-slate-100 rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 rounded-xl">
                    Create Stream
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:bg-slate-900/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Streams</p>
                  <p className="text-2xl font-bold text-slate-100">{stats.totalStreams}</p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Calendar className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:bg-slate-900/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Streams</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.activeStreams}</p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Play className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl hover:bg-slate-900/70 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Value Locked</p>
                  <p className="text-2xl font-