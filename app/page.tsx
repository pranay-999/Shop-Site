"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { API_BASE } from "@/lib/api"
import {
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Search,
} from "lucide-react"
import { CategorySelector } from "@/components/layout/category-selector"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Input } from "@/components/ui/input"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalRevenue: 0,
  })

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch all in parallel
        const [billsRes, totalItemsRes, lowStockRes] = await Promise.allSettled([
          fetch(`${API_BASE}/bills`),
          fetch(`${API_BASE}/stocks/stats/total`),
          fetch(`${API_BASE}/stocks/stats/low-count`),
        ])

        // Process bills
        let todaySales = 0, weekSales = 0, monthSales = 0, totalRevenue = 0
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
            if (d >= today) todaySales++
            if (d >= weekAgo) weekSales++
            if (d >= monthAgo) monthSales++
          })
        }

        // Process stock counts
        let totalItems = 0, lowStock = 0
        if (totalItemsRes.status === "fulfilled" && totalItemsRes.value.ok) {
          totalItems = await totalItemsRes.value.json()
        }
        if (lowStockRes.status === "fulfilled" && lowStockRes.value.ok) {
          lowStock = await lowStockRes.value.json()
        }

        setStats({ totalItems, lowStock, todaySales, weekSales, monthSales, totalRevenue })
      } catch {
        // backend not running — keep zeros
      }
    }
    loadStats()
  }, [])

  const [recentActivity, setRecentActivity] = useState<
    { id: string; type: string; description: string; time: string }[]
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
          const time = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : mins < 1 ? "just now" : `${mins}m ago`
          return {
            id: String(b.id),
            type: "sale",
            description: `Sale to ${b.customerName} — ₹${(b.totalAmount ?? 0).toLocaleString("en-IN")}`,
            time,
          }
        }))
      } catch {
        // keep empty — backend not running
      }
    }
    loadRecent()
  }, [])

  return (
    <AppSidebar>
      <div className="min-h-screen">
        {/* Page Header */}
        <header className="border-b bg-card/50 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here&apos;s an overview of your business.</p>
            </div>
            <div className="flex items-center gap-3">
              <CategorySelector />
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <section className="border-b bg-card/50 px-4 py-6 md:px-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/bills?filter=today")}
              className="p-4 bg-card border rounded-lg text-left hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(142,76%,36%)]/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-[hsl(142,76%,36%)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Bills</p>
                  <p className="text-2xl font-bold">{stats.todaySales}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/bills?filter=week")}
              className="p-4 bg-card border rounded-lg text-left hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[hsl(221,83%,53%)]/10 rounded-lg">
                  <FileText className="h-5 w-5 text-[hsl(221,83%,53%)]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.weekSales}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => router.push("/bills?filter=month")}
              className="p-4 bg-card border rounded-lg text-left hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{stats.monthSales}</p>
                </div>
              </div>
            </button>

            <div className="p-4 bg-card border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹{(stats.totalRevenue / 1000).toFixed(1)}k</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="px-4 py-6 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Search & Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search products or bills..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Quick Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Inventory Overview</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Products</span>
                      <span className="font-semibold">{stats.totalItems}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Low Stock Alerts</span>
                      <span className={`font-semibold ${stats.lowStock > 0 ? "text-destructive" : ""}`}>
                        {stats.lowStock}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Sales Summary</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-semibold">{stats.todaySales} bills</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-semibold">{stats.monthSales} bills</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-1">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                        <div
                          className={`w-2 h-2 mt-2 rounded-full ${activity.type === "sale" ? "bg-[hsl(142,76%,36%)]" : "bg-primary"
                            }`}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSidebar>
  )
}
