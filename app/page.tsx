"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  Package,
  ShoppingCart,
  FileText,
  BarChart3,
  Plus,
  Layers,
  Search,
  TrendingUp,
  AlertTriangle,
  Edit,
  MoreVertical,
  Moon,
  Sun,
} from "lucide-react"
import { CategorySelector } from "@/components/layout/category-selector"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useRef } from "react"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null
    const current = saved ?? "light"
    setTheme(current)
    if (current === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    setSettingsOpen(false)
  }

  const [stats, setStats] = useState({
    totalItems: 142,
    lowStock: 5,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalRevenue: 45230,
  })

  useEffect(() => {
    const loadBillStats = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/bills")
        if (!res.ok) return
        const bills: Array<{ createdAt?: string }> = await res.json()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
        const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1)
        let todaySales = 0, weekSales = 0, monthSales = 0
        bills.forEach((b) => {
          if (!b.createdAt) return
          const d = new Date(b.createdAt)
          if (d >= today) todaySales++
          if (d >= weekAgo) weekSales++
          if (d >= monthAgo) monthSales++
        })
        setStats((prev) => ({ ...prev, todaySales, weekSales, monthSales }))
      } catch {
        // backend not running — keep default zeros
      }
    }
    loadBillStats()
  }, [])

  const recentActivity = [
    { id: "1", type: "sale", description: "Sale to Rajesh Kumar - ₹5,015", time: "10 minutes ago" },
    { id: "2", type: "stock", description: "Added Premium Marble Tile - 50 boxes", time: "1 hour ago" },
    { id: "3", type: "sale", description: "Sale to Priya Sharma - ₹12,450", time: "2 hours ago" },
    { id: "4", type: "stock", description: "Added Classic Floor Tile - 80 boxes", time: "3 hours ago" },
    { id: "5", type: "sale", description: "Sale to Amit Patel - ₹8,920", time: "5 hours ago" },
  ]

  const navigationCards = [
    {
      title: "Create Sale",
      description: "Process new transactions and generate customer bills instantly",
      href: "/sales",
      icon: ShoppingCart,
      color: "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)]",
      stat: `${stats.todaySales} today`,
    },
    {
      title: "View Invoices",
      description: "Access, print, and manage all your billing history",
      href: "/bills",
      icon: FileText,
      color: "bg-[hsl(221,83%,53%)]/10 text-[hsl(221,83%,53%)]",
      stat: null,
    },
    {
      title: "Add New Stock",
      description: "Quickly add new inventory items via manual entry or Excel upload",
      href: "/stocks/add",
      icon: Plus,
      color: "bg-accent/10 text-accent",
      stat: null,
    },
    {
      title: "Manage Inventory",
      description: "View, edit, and organize all your stock items in one place",
      href: "/stocks",
      icon: Package,
      color: "bg-primary/10 text-primary",
      stat: `${stats.totalItems} items`,
    },
    {
      title: "Edit Bill",
      description: "Search and modify existing bills by bill number or customer info",
      href: "/bills/edit/search",
      icon: Edit,
      color: "bg-orange-500/10 text-orange-500",
      stat: null,
    },
    {
      title: "Analytics Dashboard",
      description: "Track sales trends, low stock alerts, and performance metrics",
      href: "/analytics",
      icon: BarChart3,
      color: "bg-destructive/10 text-destructive",
      stat: stats.lowStock > 0 ? `${stats.lowStock} low stock alerts` : null,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-4">
          {/* Top row: logo on left, category + settings on right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Layers className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StockFlow</h1>
                <p className="text-sm text-muted-foreground">Tiles & Sanitary Management System</p>
              </div>
            </div>

            {/* Right side: Category selector + Settings */}
            <div className="flex items-center gap-3">
              <CategorySelector />
              <div className="relative" ref={settingsMenuRef}>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                  aria-label="Settings"
                >
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                {settingsOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md border bg-card shadow-lg z-50">
                    <button
                      onClick={toggleTheme}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors rounded-md"
                    >
                      {theme === "light" ? (
                        <>
                          <Moon className="h-4 w-4" />
                          Switch to Dark Mode
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4" />
                          Switch to Light Mode
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-6 border-b bg-card/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 max-w-6xl mx-auto">
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
                  <p className="text-sm text-muted-foreground">Today's Bills</p>
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
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-3">
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

            <div className="grid gap-6 md:grid-cols-2">
              {navigationCards.map((card) => {
                const Icon = card.icon
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group relative bg-card border rounded-xl p-6 hover:border-primary hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        {card.stat && (
                          <Badge variant="secondary" className="text-xs">
                            {card.stat}
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-muted-foreground leading-relaxed mb-4 flex-grow text-sm">{card.description}</p>
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <span>Get started</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
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
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
