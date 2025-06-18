```tsx
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Lock, TrendingUp, Users, DollarSign, Calendar, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-slate-900/20" />
      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <Badge className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-4 py-2 text-sm font-medium">
          Next-Gen Token Streaming Protocol
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-6 leading-tight">
          Stream Tokens
          <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Like Never Before
          </span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Create, manage, and automate token streams with precision. Lock tokens, schedule vesting, 
          and build trust through transparent, programmable payments on Solana.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <Link href="/create" className="flex items-center gap-2">
              Start Streaming
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
          >
            <Link href="/dashboard">
              View Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function StatsSection() {
  const stats = [
    { icon: DollarSign, label: 'Total Value Locked', value: '$2.4B+', change: '+12.5%' },
    { icon: Users, label: 'Active Streams', value: '45,231', change: '+8.2%' },
    { icon: Lock, label: 'Tokens Locked', value: '892M', change: '+15.7%' },
    { icon: TrendingUp, label: 'Monthly Volume', value: '$156M', change: '+23.1%' }
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="w-8 h-8 text-indigo-400" />
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {stat.change}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Lock,
      title: 'Token Locking',
      description: 'Secure token locks with customizable release schedules and cliff periods.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Calendar,
      title: 'Vesting Schedules',
      description: 'Create linear or custom vesting schedules for team tokens and investor allocations.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Multi-Sig Security',
      description: 'Enterprise-grade security with multi-signature wallet support and audit trails.',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Zap,
      title: 'Instant Streaming',
      description: 'Real-time token streaming with second-by-second precision and automatic distribution.',
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-100 mb-6">
            Powerful Features for
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Modern DeFi
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Everything you need to manage token distribution, vesting, and streaming in one comprehensive platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-900/50 backdrop-blur-sm border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 group">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-100">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-300 text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border-indigo-500/20 rounded-2xl p-12">
          <CardContent className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100">
              Ready to Start Streaming?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of projects already using StreamFlow to manage their token distribution and vesting schedules.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
              >
                <Link href="/create" className="flex items-center gap-2">
                  Create Your First Stream
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
              >
                <Link href="/docs">
                  Read Documentation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <CTASection />
      </Suspense>
    </div>
  )
}
```