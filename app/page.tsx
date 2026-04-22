"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE } from "@/lib/api"
import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  BarChart3,
  ArrowUpRight,
  Users,
  Calendar,
  Zap,
  Target,
} from "lucide-react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  const router = useRouter()

  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    weekRevenue: 0,
    totalCustomers: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [billsRes, totalItemsRes, lowStockRes] = await Promise.allSettled([
          fetch(`${API_BASE}/bills`),
          fetch(`${API_BASE}/stocks/stats/total`),
          fetch(`${API_BASE}/stocks/stats/low-count`),
        ])

        let todaySales = 0, weekSales = 0, monthSales = 0, totalRevenue = 0, todayRevenue = 0, weekRevenue = 0
        const customerSet = new Set<string>()
        if (billsRes.status === "fulfilled" && billsRes.value.ok) {
          const bills: Array<{ createdAt?: string; totalAmount?: number; customerName?: string }> = await billsRes.value.json()
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
          const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1)
          bills.forEach((b) => {
            totalRevenue += b.totalAmount ?? 0
            if (b.customerName) customerSet.add(b.customerName.toLowerCase())
            if (!b.createdAt) return
            const d = new Date(b.createdAt)
            if (d >= today) {
              todaySales++
              todayRevenue += b.totalAmount ?? 0
            }
            if (d >= weekAgo) {
              weekSales++
              weekRevenue += b.totalAmount ?? 0
            }
            if (d >= monthAgo) monthSales++
          })
        }

        let totalItems = 0, lowStock = 0
        if (totalItemsRes.status === "fulfilled" && totalItemsRes.value.ok) {
          totalItems = await totalItemsRes.value.json()
        }
        if (lowStockRes.status === "fulfilled" && lowStockRes.value.ok) {
          lowStock = await lowStockRes.value.json()
        }

        setStats({ 
          totalItems, 
          lowStock, 
          todaySales, 
          weekSales, 
          monthSales, 
          totalRevenue, 
          todayRevenue, 
          weekRevenue,
          totalCustomers: customerSet.size,
        })
      } catch {
        // backend not running
      }
    }
    loadStats()
  }, [])

  const [recentActivity, setRecentActivity] = useState<
    { id: string; type: string; customerName: string; amount: number; time: string }[]
  >([])

  useEffect(() => {
    const loadRecent = async () => {
      try {
        const res = await fetch(`${API_BASE}/bills`)
        if (!res.ok) return
        const bills: Array<{
          id: number; billNumber: string; customerName: string;
          totalAmount?: number; createdAt?: string
        }> = await res.json()
        const sorted = [...bills]
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 5)
        const now = Date.now()
        setRecentActivity(sorted.map((b) => {
          const diff = now - new Date(b.createdAt ?? now).getTime()
          const mins = Math.floor(diff / 60000)
          const hrs = Math.floor(mins / 60)
          const days = Math.floor(hrs / 24)
          const time = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins < 1 ? "Just now" : `${mins}m ago`
          return {
            id: String(b.id),
            type: "sale",
            customerName: b.customerName,
            amount: b.totalAmount ?? 0,
            time,
          }
        }))
      } catch {
        // keep empty
      }
    }
    loadRecent()
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 100000) return `${(value / 100000).toFixed(1)}L`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toLocaleString("en-IN")
  }

  const today = new Date()
  const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening"

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm px-6 py-5 sticky top-0 z-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{greeting}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {today.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <Button onClick={() => router.push("/sales")} size="sm">
              <Zap className="mr-2 h-4 w-4" />
              Quick Sale
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Performance Summary */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Total Revenue Card */}
            <div className="md:col-span-2 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      {formatCurrency(stats.totalRevenue)}
                    </span>
                    <span className="text-lg text-muted-foreground">INR</span>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-accent" />
                      <span className="text-muted-foreground">Today:</span>
                      <span className="font-medium text-foreground">{formatCurrency(stats.todayRevenue)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">This week:</span>
                      <span className="font-medium text-foreground">{formatCurrency(stats.weekRevenue)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push("/analytics")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stats.monthSales}</p>
                <p className="text-sm text-muted-foreground">total transactions</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-accent">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">{stats.weekSales} this week</span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.todaySales}</p>
                  <p className="text-xs text-muted-foreground">Sales Today</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Total Customers</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <Package className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </div>

            <div 
              className={`rounded-xl border p-5 hover:shadow-sm transition-shadow cursor-pointer ${
                stats.lowStock > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card"
              }`}
              onClick={() => router.push("/stocks")}
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  stats.lowStock > 0 ? "bg-destructive/10" : "bg-secondary"
                }`}>
                  <Target className={`h-5 w-5 ${stats.lowStock > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stats.lowStock > 0 ? "text-destructive" : "text-foreground"}`}>
                    {stats.lowStock}
                  </p>
                  <p className="text-xs text-muted-foreground">Low Stock Items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Recent Activity */}
            <div className="lg:col-span-3 rounded-2xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Recent Activity</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/bills")}>
                  View All
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="divide-y">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                          <span className="text-sm font-medium text-accent">
                            {activity.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{activity.customerName}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-accent">
                        +{activity.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                      <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="mt-4 font-medium text-foreground">No recent activity</p>
                    <p className="mt-1 text-sm text-muted-foreground">Start by creating your first sale</p>
                    <Button className="mt-4" onClick={() => router.push("/sales")}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Create Sale
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
              <h2 className="font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/sales")}
                  className="w-full flex items-center gap-4 rounded-xl border bg-primary/5 p-4 text-left hover:bg-primary/10 transition-colors group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
                    <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">New Sale</p>
                    <p className="text-xs text-muted-foreground">Create a new invoice</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => router.push("/stocks/add")}
                  className="w-full flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                    <Package className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Add Stock</p>
                    <p className="text-xs text-muted-foreground">Add new inventory items</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </button>

                <button
                  onClick={() => router.push("/bills")}
                  className="w-full flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chart-3/10">
                    <FileText className="h-5 w-5 text-chart-3" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">View Invoices</p>
                    <p className="text-xs text-muted-foreground">Manage all bills</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-3 transition-colors" />
                </button>

                <button
                  onClick={() => router.push("/analytics")}
                  className="w-full flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-secondary/50 transition-colors group"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-chart-5/10">
                    <Calendar className="h-5 w-5 text-chart-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Reports</p>
                    <p className="text-xs text-muted-foreground">View business analytics</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-chart-5 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
