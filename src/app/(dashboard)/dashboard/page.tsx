'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import type { DashboardStats } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const weeklyData = [
  { day: 'Mon', sales: 45000, profit: 12000 },
  { day: 'Tue', sales: 52000, profit: 14500 },
  { day: 'Wed', sales: 48000, profit: 13000 },
  { day: 'Thu', sales: 61000, profit: 16800 },
  { day: 'Fri', sales: 58000, profit: 15200 },
  { day: 'Sat', sales: 72000, profit: 19500 },
  { day: 'Sun', sales: 68000, profit: 18000 },
]

const monthlyData = [
  { month: 'Jan', revenue: 1200000, expenses: 850000 },
  { month: 'Feb', revenue: 1350000, expenses: 900000 },
  { month: 'Mar', revenue: 1100000, expenses: 780000 },
  { month: 'Apr', revenue: 1480000, expenses: 950000 },
  { month: 'May', revenue: 1520000, expenses: 980000 },
  { month: 'Jun', revenue: 1680000, expenses: 1020000 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data.data)
        }
      } catch {
        // Use defaults
      }
    }
    loadStats()
  }, [])

  const statCards = [
    {
      title: "Today's Sales",
      value: formatCurrency(stats?.todaySales ?? 0),
      icon: DollarSign,
      trend: '+12.5%',
      trendUp: true,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Weekly Sales',
      value: formatCurrency(stats?.weeklySales ?? 0),
      icon: ShoppingCart,
      trend: '+8.2%',
      trendUp: true,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Active Products',
      value: String(stats?.totalProducts ?? 0),
      icon: Package,
      trend: '+5',
      trendUp: true,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Total Customers',
      value: String(stats?.totalCustomers ?? 0),
      icon: Users,
      trend: '+23',
      trendUp: true,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Real-time overview of your retail business" />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {card.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={card.trendUp ? 'text-green-500' : 'text-red-500'}>{card.trend}</span>
                <span className="text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(221.2 83.2% 53.3%)" radius={[4, 4, 0, 0]} name="Sales" />
                  <Bar dataKey="profit" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(221.2 83.2% 53.3%)" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="hsl(0 84.2% 60.2%)" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.lowStockCount ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Products below minimum stock level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalProfit ?? 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Net profit this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalOrders ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">{stats?.pendingOrders ?? 0} pending</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
