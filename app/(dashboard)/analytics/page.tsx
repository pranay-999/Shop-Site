"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle, Package, ShoppingCart, IndianRupee, X, Printer, ArrowLeft } from "lucide-react"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { API_BASE } from "@/lib/api"

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stocks, setStocks] = useState<any[]>([])
  const [bills, setBills] = useState<any[]>([])

  // For bill list modal (Today / This Week / This Month)
  const [billListModal, setBillListModal] = useState<{ open: boolean; title: string; bills: any[] }>({
    open: false, title: "", bills: []
  })

  // For single bill detail modal
  const [billDetailModal, setBillDetailModal] = useState<{ open: boolean; bill: any | null }>({
    open: false, bill: null
  })

  

  useEffect(() => {
    async function loadData() {
      try {
        const [stocksRes, billsRes] = await Promise.all([
          fetch(`${API_BASE}/stocks`),
          fetch(`${API_BASE}/bills`),
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

  // ── Derived stats ─────────────────────────────────────────────────────────

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
    { period: "Today", sales: billsToday.length, revenue: sumRevenue(billsToday), billsList: billsToday },
    { period: "This Week", sales: billsWeek.length, revenue: sumRevenue(billsWeek), billsList: billsWeek },
    { period: "This Month", sales: billsMonth.length, revenue: sumRevenue(billsMonth), billsList: billsMonth },
  ]

  // Low stock items
  const lowStockItems = stocks
    .filter(s => (s.noOfBoxes ?? s.totalBoxes ?? 0) < 10)
    .sort((a, b) => (a.noOfBoxes ?? 0) - (b.noOfBoxes ?? 0))
    .slice(0, 10)

  // Top selling
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

  // ── Print handler ──────────────────────────────────────────────────────────

  function handlePrint() {
    const bill = billDetailModal.bill
    if (!bill) return
    const win = window.open("", "_blank")
    if (!win) return

    const billNumber = bill.billNumber ?? bill.id ?? "—"
    const customerName = bill.customerName ?? bill.customer ?? "—"
    const customerPhone = bill.customerPhone ?? bill.phoneNumber ?? ""
    const dateStr = bill.createdAt ?? bill.billDate ?? ""
    const formattedDate = dateStr
      ? new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    const items = bill.items ?? []
    const subtotal = bill.subtotal ?? 0
    const gstAmount = bill.gstAmount ?? 0
    const gstRate = bill.gstRate ?? 0
    const discount = bill.discount ?? 0
    const grandTotal = bill.totalAmount ?? bill.grandTotal ?? 0

    const html = `
      <div style="font-family:Arial,sans-serif; padding:32px; max-width:620px; margin:0 auto; border:1px solid #e0e0e0;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h2 style="margin:0; font-size:22px;">INVOICE</h2>
            <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${billNumber}</strong></p>
          </div>
          <div style="text-align:right; font-size:13px; color:#555;">
            <p style="margin:0;">Date: ${formattedDate}</p>
          </div>
        </div>
        <div style="margin-bottom:16px; font-size:14px;">
          <p style="margin:0;"><strong>Customer:</strong> ${customerName}</p>
          ${customerPhone ? `<p style="margin:4px 0 0;"><strong>Phone:</strong> ${customerPhone}</p>` : ""}
        </div>
        <table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:13px; margin-bottom:16px;">
          <thead style="background:#f5f5f5;">
            <tr>
              <th style="text-align:left;">Design</th>
              <th style="text-align:right;">Boxes</th>
              <th style="text-align:right;">Price/Box</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any) => `
              <tr>
                <td>${item.designName ?? item.design_name ?? "—"}${item.size ? ` (${item.size})` : ""}</td>
                <td style="text-align:right;">${item.quantityBoxes ?? item.boxes ?? 0}</td>
                <td style="text-align:right;">₹${item.pricePerBox ?? item.price ?? 0}</td>
                <td style="text-align:right;">₹${(item.totalPrice ?? item.total ?? 0).toLocaleString("en-IN")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div style="text-align:right; font-size:14px;">
          <p style="margin:4px 0;">Subtotal: ₹${subtotal.toLocaleString("en-IN")}</p>
          ${gstAmount > 0 ? `<p style="margin:4px 0;">GST (${gstRate}%): ₹${gstAmount.toLocaleString("en-IN")}</p>` : ""}
          ${discount > 0 ? `<p style="margin:4px 0; color:#16a34a;">Discount: -₹${discount.toLocaleString("en-IN")}</p>` : ""}
          <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
            Total: ₹${grandTotal.toLocaleString("en-IN")}
          </p>
        </div>
      </div>`

    win.document.write(`<html><head><title>Invoice ${billNumber}</title><style>@media print{body{margin:0;}}</style></head><body style="background:#fff; padding:24px;">${html}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

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

          {/* ── Sales Trends (clickable cards) ─────────────────────────── */}
          <div className="grid gap-4 md:grid-cols-3">
            {salesTrends.map((trend, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
                onClick={() => setBillListModal({ open: true, title: trend.period, bills: trend.billsList })}
              >
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
                  <p className="text-xs text-primary mt-3 text-right">Click to view bills →</p>
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
                    <span className="text-sm font-medium">In Stock (≥10 boxes)</span>
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
                  Revenue Overview
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

      {/* ── MODAL 1: Bill List (Today / This Week / This Month) ─────────────── */}
      {billListModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{billListModal.title} — Bills</h2>
              <button
                onClick={() => setBillListModal({ open: false, title: "", bills: [] })}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Bill list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {billListModal.bills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bills found for this period.</p>
              ) : (
                billListModal.bills.map((bill, i) => (
                  <button
                    key={bill.id ?? i}
                    onClick={() => {
                      setBillDetailModal({ open: true, bill })
                      setBillListModal({ open: false, title: "", bills: [] })
                    }}
                    className="w-full text-left p-4 rounded-lg border hover:bg-muted hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Bill #{bill.id ?? bill.billNumber ?? `${i + 1}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.customerName ?? bill.customer ?? "Customer"} •{" "}
                          {new Date(bill.createdAt ?? bill.billDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        ₹{(bill.totalAmount ?? bill.grandTotal ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Bill Detail with Print / Cancel ─────────────────────────── */}
      {billDetailModal.open && billDetailModal.bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">
                Bill #{billDetailModal.bill.id ?? billDetailModal.bill.billNumber ?? "—"}
              </h2>
              <button
                onClick={() => setBillDetailModal({ open: false, bill: null })}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable content */}
            <div className="overflow-y-auto flex-1 p-5">
              {/* Customer info */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold text-lg">
                  {billDetailModal.bill.customerName ?? billDetailModal.bill.customer ?? "—"}
                </p>
                {billDetailModal.bill.customerPhone && (
                  <p className="text-sm text-muted-foreground">{billDetailModal.bill.customerPhone}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Date: {new Date(billDetailModal.bill.createdAt ?? billDetailModal.bill.billDate).toLocaleDateString("en-IN")}
                </p>
              </div>

              {/* Items table */}
              {(billDetailModal.bill.items ?? []).length > 0 && (
                <table className="w-full text-sm border-collapse mb-4">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left p-2 border rounded-tl">Design</th>
                      <th className="text-center p-2 border">Boxes</th>
                      <th className="text-right p-2 border rounded-tr">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(billDetailModal.bill.items ?? []).map((item: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 border">{item.designName ?? item.design_name ?? "—"}</td>
                        <td className="p-2 border text-center">{item.quantityBoxes ?? item.boxes ?? 0}</td>
                        <td className="p-2 border text-right">₹{(item.totalPrice ?? item.total ?? 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg font-semibold text-base">
                <span>Total Amount</span>
                <span>₹{(billDetailModal.bill.totalAmount ?? billDetailModal.bill.grandTotal ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 p-5 border-t">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 font-medium hover:opacity-90 transition-opacity"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                onClick={() => setBillDetailModal({ open: false, bill: null })}
                className="flex-1 flex items-center justify-center gap-2 border rounded-lg py-2.5 font-medium hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}