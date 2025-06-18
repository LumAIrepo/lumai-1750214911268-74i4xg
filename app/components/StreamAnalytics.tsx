```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Zap
} from 'lucide-react'

interface StreamData {
  id: string
  recipient: string
  amount: number
  streamed: number
  remaining: number
  startTime: number
  endTime: number
  status: 'active' | 'completed' | 'cancelled'
  tokenSymbol: string
}

interface AnalyticsData {
  totalStreams: number
  totalValue: number
  activeStreams: number
  completedStreams: number
  totalRecipients: number
  averageStreamSize: number
  monthlyVolume: Array<{ month: string; volume: number }>
  streamsByStatus: Array<{ name: string; value: number; color: string }>
  topTokens: Array<{ symbol: string; volume: number; streams: number }>
  dailyActivity: Array<{ date: string; created: number; completed: number }>
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

export default function StreamAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: AnalyticsData = {
        totalStreams: 1247,
        totalValue: 2847392.45,
        activeStreams: 342,
        completedStreams: 905,
        totalRecipients: 892,
        averageStreamSize: 2284.12,
        monthlyVolume: [
          { month: 'Jan', volume: 245000 },
          { month: 'Feb', volume: 312000 },
          { month: 'Mar', volume: 289000 },
          { month: 'Apr', volume: 398000 },
          { month: 'May', volume: 445000 },
          { month: 'Jun', volume: 523000 },
        ],
        streamsByStatus: [
          { name: 'Active', value: 342, color: '#10b981' },
          { name: 'Completed', value: 905, color: '#6366f1' },
          { name: 'Cancelled', value: 23, color: '#ef4444' },
        ],
        topTokens: [
          { symbol: 'SOL', volume: 1245000, streams: 456 },
          { symbol: 'USDC', volume: 892000, streams: 234 },
          { symbol: 'RAY', volume: 345000, streams: 123 },
          { symbol: 'SRM', volume: 234000, streams: 89 },
        ],
        dailyActivity: [
          { date: '2024-01-01', created: 12, completed: 8 },
          { date: '2024-01-02', created: 15, completed: 11 },
          { date: '2024-01-03', created: 9, completed: 14 },
          { date: '2024-01-04', created: 18, completed: 9 },
          { date: '2024-01-05', created: 22, completed: 16 },
          { date: '2024-01-06', created: 14, completed: 19 },
          { date: '2024-01-07', created: 16, completed: 12 },
        ]
      }
      
      setAnalyticsData(mockData)
      setLoading(false)
    }

    fetchAnalytics()
  }, [timeframe])

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analyticsData) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const getChangePercentage = (current: number, previous: number) => {
    return ((current - previous) / previous * 100).toFixed(1)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Stream Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor your streaming performance and insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
              className={timeframe === period 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0' 
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Value Streamed</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">
                  {formatCurrency(analyticsData.totalValue)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-500 text-sm font-medium ml-1">+12.5%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Streams</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">
                  {formatNumber(analyticsData.totalStreams)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                  <span className="text-indigo-500 text-sm font-medium ml-1">+8.2%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 rounded-xl">
                <Activity className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Streams</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">
                  {formatNumber(analyticsData.activeStreams)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-purple-500" />
                  <span className="text-purple-500 text-sm font-medium ml-1">+15.3%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Recipients</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">
                  {formatNumber(analyticsData.totalRecipients)}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-500 text-sm font-medium ml-1">+6.7%</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl">
                <Users className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Monthly Volume</CardTitle>
            <CardDescription className="text-slate-400">
              Streaming volume over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlyVolume}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.75rem',
                    color: '#f1f5f9'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#volumeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stream Status Distribution */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Stream Status Distribution</CardTitle>
            <CardDescription className="text-slate-400">
              Breakdown of streams by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.streamsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analyticsData.streamsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />