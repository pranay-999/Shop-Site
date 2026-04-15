"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle, Package, ShoppingCart, IndianRupee } from "lucide-react"
import { NavigationHeader } from "@/components/layout/navigation-header"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [stocksRes, billsRes] = await Promise.all([
          fetch(`${API}/stocks`),
          fetch(`${API}/bills`),
        ])
        const stocksData = await stocksRes.json()
        const billsData = await billsRes.json()
        setStocks(Array.isArray(stocksData) ? stocksData : [])
        setBills(Array.isArray(billsData) ? billsData : [])
      } catch (err) {
        console.error("Failed to load analytics data", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const billsToday = bills.filter(b => new Date(b.createdAt ?? b.billDate) >= startOfToday)
  const billsWeek = bills.filter(b => new Date(b.createdAt ?? b.billDate) >= startOfWeek)
  const billsMonth = bills.filter(b => new Date(b.createdAt ?? b.billDate) >= startOfMonth)

  const sumRevenue = (list: any[]) =>
    list.reduce((s, b) => s + (b.totalAmount ?? b.grandTotal ?? 0), 0)

  const salesTrends = [
    { period: "Today", sales: billsToday.length, revenue: sumRevenue(billsToday) },
    { period: "This Week", sales: billsWeek.length, revenue: sumRevenue(billsWeek) },
    { period: "This Month", sales: billsMonth.length, revenue: sumRevenue(billsMonth) },
  ]

  // Low stock: remaining boxes < 10
  const lowStockItems = stocks
    .filter(s => (s.noOfBoxes ?? s.totalBoxes ?? 0) < 10)
    .sort((a, b) => (a.noOfBoxes ?? 0) - (b.noOfBoxes ?? 0))
    .slice(0, 10)

  // Top selling: count boxes sold per design name from all bill items
  const soldMap: Record<string, { sold: number; revenue: number }> = {}
  bills.forEach(bill => {
    (bill.items ?? []).forEach((item: any) => {
      const key = item.designName ?? item.design_name ?? "Unknown"
      if (!soldMap[key]) soldMap[key] = { sold: 0, revenue: 0 }
      soldMap[key].sold += item.quantityBoxes ?? item.boxes ?? 0
      soldMap[key].revenue += item.totalPrice ?? item.total ?? 0
    })
  })
  const topSelling = Object.entries(soldMap)
    .map(([name, v]) => ({ design_name: name, ...v }))
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)

  // Stock overview
  const totalStockValue = stocks.reduce((s, st) => {
    const boxes = st.noOfBoxes ?? st.totalBoxes ?? 0
    const price = st.pricePerBox ?? st.price ?? 0
    return s + boxes * price
  }, 0)
  const totalItems = stocks.length
  const inStock = stocks.filter(s => (s.noOfBoxes ?? s.totalBoxes ?? 0) >= 10).length
  const lowStockCount = stocks.filter(s => (s.noOfBoxes ?? s.totalBoxes ?? 0) < 10).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Analytics & Reports" }]}
        title="Analytics & Reports"
        description="Track performance metrics and insights"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">

          {/* Sales Trends */}
          <div className="grid gap-4 md:grid-cols-3">
            {salesTrends.map((trend, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">{trend.period}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Bills</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{trend.sales}</span>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="text-lg font-semibold">₹{trend.revenue.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stock Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stock Value Overview</CardTitle>
                <CardDescription>Current inventory value breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Stock Value</span>
                    <span className="text-xl font-bold">₹{totalStockValue.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Designs</span>
                    <span className="text-xl font-bold">{totalItems}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <span className="text-sm font-medium">Healthy Stock (≥10 boxes)</span>
                    <span className="text-xl font-bold text-green-600">{inStock}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                    <span className="text-sm font-medium">Low Stock (&lt;10 boxes)</span>
                    <span className="text-xl font-bold text-destructive">{lowStockCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
                <CardDescription>All time earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">All Time Revenue</span>
                    <span className="text-xl font-bold">₹{sumRevenue(bills).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Total Bills</span>
                    <span className="text-xl font-bold">{bills.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Avg. Bill Value</span>
                    <span className="text-xl font-bold">
                      ₹{bills.length > 0 ? Math.round(sumRevenue(bills) / bills.length).toLocaleString("en-IN") : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Low Stock Alerts
                  </CardTitle>
                  <CardDescription>Items with fewer than 10 boxes remaining</CardDescription>
                </div>
                <Badge variant="destructive">{lowStockItems.length} Items</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">All items are well stocked ✅</p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-destructive" />
                        <div>
                          <p className="font-medium">{item.designName}</p>
                          <p className="text-sm text-muted-foreground">{item.size} • {item.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">{item.noOfBoxes ?? item.totalBoxes ?? 0}</p>
                        <p className="text-xs text-muted-foreground">boxes left</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <CardDescription>All time best performers by boxes sold</CardDescription>
            </CardHeader>
            <CardContent>
              {topSelling.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
              ) : (
                <div className="space-y-4">
                  {topSelling.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{item.design_name}</p>
                          <p className="text-sm text-muted-foreground">{item.sold} boxes sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">₹{item.revenue.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}