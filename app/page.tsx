"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE } from "@/lib/api"
import {
  Package,
  ShoppingCart,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Clock,
  IndianRupee,
  BarChart3,
  ArrowUpRight,
  Boxes,
} from "lucide-react"
import { CategorySelector } from "@/components/layout/category-selector"
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
        if (billsRes.status === "fulfilled" && billsRes.value.ok) {
          const bills: Array<{ createdAt?: string; totalAmount?: number }> = await billsRes.value.json()
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
          const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1)
          bills.forEach((b) => {
            totalRevenue += b.totalAmount ?? 0
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

        setStats({ totalItems, lowStock, todaySales, weekSales, monthSales, totalRevenue, todayRevenue, weekRevenue })
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
          .slice(0, 6)
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

  const quickActions = [
    { label: "New Sale", href: "/sales", icon: ShoppingCart, color: "bg-primary" },
    { label: "Add Stock", href: "/stocks/add", icon: Package, color: "bg-accent" },
    { label: "View Reports", href: "/analytics", icon: BarChart3, color: "bg-chart-3" },
  ]

  return (
    <AppSidebar>
      <div className="min-h-screen">
        {/* Header */}
        <header className="border-b bg-card px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">Welcome back! Here&apos;s your business overview.</p>
            </div>
            <div className="flex items-center gap-3">
              <CategorySelector />
              <Button onClick={() => router.push("/sales")} className="hidden sm:flex">
                <ShoppingCart className="mr-2 h-4 w-4" />
                New Sale
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Quick Actions - Mobile */}
          <div className="flex gap-2 sm:hidden">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="outline"
                className="flex-1"
                onClick={() => router.push(action.href)}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Today's Revenue */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                  <IndianRupee className="h-4 w-4 text-accent" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground">{formatCurrency(stats.todayRevenue)}</span>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-accent font-medium">{stats.todaySales} sales today</span>
                </div>
              </div>
            </div>

            {/* Week Revenue */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">This Week</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground">{formatCurrency(stats.weekRevenue)}</span>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{stats.weekSales} invoices</span>
                </div>
              </div>
            </div>

            {/* Total Inventory */}
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Inventory</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-chart-5/10">
                  <Boxes className="h-4 w-4 text-chart-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-foreground">{stats.totalItems}</span>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>Products in stock</span>
                </div>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className={`rounded-xl border p-5 ${stats.lowStock > 0 ? "bg-destructive/5 border-destructive/20" : "bg-card"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Low Stock</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stats.lowStock > 0 ? "bg-destructive/10" : "bg-secondary"}`}>
                  <AlertTriangle className={`h-4 w-4 ${stats.lowStock > 0 ? "text-destructive" : "text-muted-foreground"}`} />
                </div>
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-bold ${stats.lowStock > 0 ? "text-destructive" : "text-foreground"}`}>
                  {stats.lowStock}
                </span>
                <div className="mt-1 flex items-center gap-1 text-xs">
                  {stats.lowStock > 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-destructive" />
                      <span className="text-destructive font-medium">Needs attention</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">All items stocked</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Revenue Overview */}
            <div className="lg:col-span-3 rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="font-semibold text-foreground">Revenue Overview</h2>
                  <p className="text-sm text-muted-foreground">Total lifetime earnings</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/analytics")}>
                  View Analytics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-foreground">
                    {formatCurrency(stats.totalRevenue)}
                  </span>
                  <span className="text-lg text-muted-foreground">INR</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push("/bills?filter=today")}
                    className="rounded-lg border bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stats.todaySales}</p>
                    <p className="text-xs text-muted-foreground">transactions</p>
                  </button>
                  <button
                    onClick={() => router.push("/bills?filter=week")}
                    className="rounded-lg border bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Week</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stats.weekSales}</p>
                    <p className="text-xs text-muted-foreground">transactions</p>
                  </button>
                  <button
                    onClick={() => router.push("/bills?filter=month")}
                    className="rounded-lg border bg-secondary/50 p-4 text-left hover:bg-secondary transition-colors"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{stats.monthSales}</p>
                    <p className="text-xs text-muted-foreground">transactions</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="lg:col-span-2 rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="font-semibold text-foreground">Recent Transactions</h2>
                <Button variant="ghost" size="sm" onClick={() => router.push("/bills")}>
                  View All
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="divide-y">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                          <ShoppingCart className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.customerName}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        +{activity.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-foreground">No transactions yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Create your first sale to get started</p>
                    <Button size="sm" className="mt-4" onClick={() => router.push("/sales")}>
                      Create Sale
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions - Desktop */}
          <div className="hidden sm:grid grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="group flex items-center gap-4 rounded-xl border bg-card p-5 text-left hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{action.label}</p>
                  <p className="text-sm text-muted-foreground">Quick access</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
