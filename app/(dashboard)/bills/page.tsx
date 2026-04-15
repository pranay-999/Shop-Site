"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Printer, Edit, Trash2, Download, AlertTriangle, CheckCircle2, History, ChevronDown, ChevronUp, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { getAllBills, searchBills } from "@/lib/services/bills"
import { API_BASE } from "@/lib/api"
import type { Bill, BillSnapshot } from "@/lib/types"

type ToastMsg = { id: number; message: string; description?: string; variant: "success" | "error" }

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [filteredBills, setFilteredBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const [viewBillOpen, setViewBillOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ✅ NEW: Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ✅ NEW: Timeline filter state
  const [timeFilter, setTimeFilter] = useState("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const [exportType, setExportType] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [printBillOpen, setPrintBillOpen] = useState(false)
  const [printOption, setPrintOption] = useState<string>("")
  const [printBillNumber, setPrintBillNumber] = useState("")

  // NEW: Print preview state
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)
  const [billToPrint, setBillToPrint] = useState<Bill | null>(null)
  const [printSelectedBills, setPrintSelectedBills] = useState<Bill[]>([])
  

  const showToast = (message: string, variant: "success" | "error", description?: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, description, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    const loadBills = async () => {
      try {
        const data = await getAllBills()
        const sorted = [...data].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        setBills(sorted)
        setFilteredBills(sorted)
      } catch {
        showToast("Failed to load bills", "error", "Make sure the backend is running.")
      } finally {
        setLoading(false)
      }
    }
    loadBills()
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { setFilteredBills(bills); return }
    try {
      const results = await searchBills(query)
      setFilteredBills([...results].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()))
    } catch {
      const lower = query.toLowerCase()
      setFilteredBills(
        bills.filter(
          (b) =>
            b.billNumber?.toLowerCase().includes(lower) ||
            b.customerName?.toLowerCase().includes(lower) ||
            b.phoneNumber?.includes(query)
        )
      )
    }
  }

  // ✅ NEW: Apply timeline filter on top of text search results
  const timeFilteredBills = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return filteredBills.filter((b) => {
      if (!b.createdAt) return true
      const d = new Date(b.createdAt)
      if (timeFilter === "today") {
        return d >= today
      }
      if (timeFilter === "yesterday") {
        const yest = new Date(today)
        yest.setDate(yest.getDate() - 1)
        return d >= yest && d < today
      }
      if (timeFilter === "week") {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return d >= weekAgo
      }
      if (timeFilter === "month") {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return d >= monthAgo
      }
      if (timeFilter === "custom" && customStart && customEnd) {
        return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59")
      }
      return true
    })
  }, [filteredBills, timeFilter, customStart, customEnd])

  // ✅ NEW: Multi-select helpers
  const idKey = (id: number) => String(id)
  const allVisible = timeFilteredBills.length > 0 && timeFilteredBills.every((b) => selectedIds.has(idKey(b.id)))
  const someSelected = selectedIds.size > 0

  const toggleSelectAll = () => {
    if (allVisible) {
      setSelectedIds((prev) => {
        const n = new Set(prev)
        timeFilteredBills.forEach((b) => n.delete(idKey(b.id)))
        return n
      })
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev)
        timeFilteredBills.forEach((b) => n.add(idKey(b.id)))
        return n
      })
    }
  }

  const toggleSelect = (id: number) => {
    const key = idKey(id)
    setSelectedIds((prev) => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  // ✅ NEW: Bulk delete — deletes all selected bills one by one
  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const selectedBills = timeFilteredBills.filter((b) => selectedIds.has(idKey(b.id)))
    let failed = 0
    for (const bill of selectedBills) {
      try {
        const res = await fetch(`${API_BASE}/bills/${encodeURIComponent(bill.billNumber)}`, { method: "DELETE" })
        if (!res.ok) throw new Error()
      } catch {
        failed++
      }
    }
    const deletedKeys = new Set(selectedBills.map((b) => idKey(b.id)))
    setBills((prev) => prev.filter((b) => !deletedKeys.has(idKey(b.id))))
    setFilteredBills((prev) => prev.filter((b) => !deletedKeys.has(idKey(b.id))))
    setSelectedIds(new Set())
    setBulkDeleteOpen(false)
    setBulkDeleting(false)
    if (failed > 0) {
      showToast(`${selectedBills.length - failed} deleted, ${failed} failed`, "error", "Some bills could not be deleted.")
    } else {
      showToast(`${selectedBills.length} bill${selectedBills.length !== 1 ? "s" : ""} deleted`, "success", "Stock has been restored for deleted bills.")
    }
  }

  // ✅ NEW: Print selected bills — opens a print window with all selected bills
  const handlePrintSelected = () => {
    const billsToPrint = timeFilteredBills.filter((b) => selectedIds.has(idKey(b.id)))
    if (billsToPrint.length === 0) return
    const win = window.open("", "_blank")
    if (!win) { showToast("Popup blocked", "error", "Please allow popups for this site to print."); return }

    const html = billsToPrint.map((bill) => `
      <div style="page-break-after:always; font-family:Arial,sans-serif; padding:32px; max-width:620px; margin:0 auto; border:1px solid #e0e0e0; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h2 style="margin:0; font-size:22px;">INVOICE</h2>
            <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${bill.billNumber}</strong></p>
          </div>
          <div style="text-align:right; font-size:13px; color:#555;">
            <p style="margin:0;">Date: ${bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
            ${bill.isEdited ? '<p style="margin:4px 0 0; color:#d97706;">⚠ Edited</p>' : ""}
          </div>
        </div>
        <div style="margin-bottom:16px; font-size:14px;">
          <p style="margin:0;"><strong>Customer:</strong> ${bill.customerName}</p>
          <p style="margin:4px 0 0;"><strong>Phone:</strong> ${bill.phoneNumber}</p>
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
            ${(bill.items ?? []).map((item) => `
              <tr>
                <td>${item.designName}${item.size ? ` (${item.size})` : ""}</td>
                <td style="text-align:right;">${item.quantityBoxes}</td>
                <td style="text-align:right;">₹${item.pricePerBox}</td>
                <td style="text-align:right;">₹${(item.totalPrice ?? 0).toLocaleString("en-IN")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div style="text-align:right; font-size:14px;">
          <p style="margin:4px 0;">Subtotal: ₹${(bill.subtotal ?? 0).toLocaleString("en-IN")}</p>
          ${(bill.gstAmount ?? 0) > 0 ? `<p style="margin:4px 0;">GST (${bill.gstRate}%): ₹${(bill.gstAmount ?? 0).toLocaleString("en-IN")}</p>` : ""}
          ${(bill.discount ?? 0) > 0 ? `<p style="margin:4px 0; color:#16a34a;">Discount: -₹${(bill.discount ?? 0).toLocaleString("en-IN")}</p>` : ""}
          <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
            Total: ₹${(bill.totalAmount ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>`).join("")

    win.document.write(`
      <html>
        <head><title>Print Bills</title>
        <style>@media print { body { margin: 0; } }</style>
        </head>
        <body style="background:#fff; padding:24px;">${html}</body>
      </html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill)
    setExpandedSnapshot(null)
    setViewBillOpen(true)
  }

  const handleDeleteClick = (bill: Bill) => {
    setBillToDelete(bill)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return
    setDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/bills/${encodeURIComponent(billToDelete.billNumber)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
      setBills((prev) => prev.filter((b) => b.id !== billToDelete.id))
      setFilteredBills((prev) => prev.filter((b) => b.id !== billToDelete.id))
      setDeleteDialogOpen(false)
      setBillToDelete(null)
      showToast("Bill deleted", "success", `Bill ${billToDelete.billNumber} deleted and stock restored.`)
    } catch {
      setDeleteDialogOpen(false)
      showToast("Could not delete bill", "error", "Please try again or check the backend.")
    } finally {
      setDeleting(false)
    }
  }

  // ✅ NEW: Print a single bill from the View dialog
  // Opens print preview dialog instead of printing immediately
  const handlePrintSingleBill = (bill: Bill) => {
    setBillToPrint(bill)
    setPrintSelectedBills([])
    setPrintPreviewOpen(true)
  }

  // Opens print preview dialog for multiple selected bills
  const handlePrintSelectedWithPreview = () => {
    const billsToPrint = timeFilteredBills.filter((b) => selectedIds.has(idKey(b.id)))
    if (billsToPrint.length === 0) return
    setBillToPrint(null)
    setPrintSelectedBills(billsToPrint)
    setPrintPreviewOpen(true)
  }
      
     // Print an old version (snapshot) of a bill
  const handlePrintSnapshot = (snapshot: BillSnapshot, bill: Bill) => {
    const win = window.open("", "_blank")
    if (!win) { showToast("Popup blocked", "error", "Please allow popups for this site to print."); return }
    win.document.write(`
      <html>
        <head><title>Invoice - ${bill.billNumber} (Old Version)</title>
        <style>@media print { body { margin: 0; } }</style>
        </head>
        <body style="background:#fff; padding:24px; font-family:Arial,sans-serif;">
          <div style="max-width:620px; margin:0 auto; border:1px solid #e0e0e0; padding:32px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
              <div>
                <h2 style="margin:0; font-size:22px;">INVOICE</h2>
                <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${bill.billNumber}</strong></p>
                <p style="margin:4px 0 0; color:#d97706; font-size:12px;">⚠ Old Version — saved on ${new Date(snapshot.snapshotAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
              <div style="text-align:right; font-size:13px; color:#555;">
                <p style="margin:0;">Original Date: ${bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
              </div>
            </div>
            <div style="margin-bottom:16px; font-size:14px;">
              <p style="margin:0;"><strong>Customer:</strong> ${snapshot.customerName}</p>
              <p style="margin:4px 0 0;"><strong>Phone:</strong> ${snapshot.phoneNumber}</p>
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
                ${(snapshot.items ?? []).map((item) => `
                  <tr>
                    <td>${item.designName}${item.size ? ` (${item.size})` : ""}</td>
                    <td style="text-align:right;">${item.quantityBoxes}</td>
                    <td style="text-align:right;">₹${item.pricePerBox}</td>
                    <td style="text-align:right;">₹${(item.totalPrice ?? 0).toLocaleString("en-IN")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div style="text-align:right; font-size:14px;">
              <p style="margin:4px 0;">Subtotal: ₹${(snapshot.subtotal ?? 0).toLocaleString("en-IN")}</p>
              ${(snapshot.gstAmount ?? 0) > 0 ? `<p style="margin:4px 0;">GST (${snapshot.gstRate}%): ₹${(snapshot.gstAmount ?? 0).toLocaleString("en-IN")}</p>` : ""}
              <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
                Total: ₹${(snapshot.totalAmount ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </body>
      </html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  // Actually does the printing (called from the preview dialog)
  const executePrint = (bills: Bill[]) => {
    const win = window.open("", "_blank")
    if (!win) { showToast("Popup blocked", "error", "Please allow popups for this site to print."); return }

    const html = bills.map((bill) => `
      <div style="page-break-after:always; font-family:Arial,sans-serif; padding:32px; max-width:620px; margin:0 auto; border:1px solid #e0e0e0; margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
          <div>
            <h2 style="margin:0; font-size:22px;">INVOICE</h2>
            <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${bill.billNumber}</strong></p>
          </div>
          <div style="text-align:right; font-size:13px; color:#555;">
            <p style="margin:0;">Date: ${bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
            ${bill.isEdited ? '<p style="margin:4px 0 0; color:#d97706;">⚠ Edited</p>' : ""}
          </div>
        </div>
        <div style="margin-bottom:16px; font-size:14px;">
          <p style="margin:0;"><strong>Customer:</strong> ${bill.customerName}</p>
          <p style="margin:4px 0 0;"><strong>Phone:</strong> ${bill.phoneNumber}</p>
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
            ${(bill.items ?? []).map((item) => `
              <tr>
                <td>${item.designName}${item.size ? ` (${item.size})` : ""}</td>
                <td style="text-align:right;">${item.quantityBoxes}</td>
                <td style="text-align:right;">₹${item.pricePerBox}</td>
                <td style="text-align:right;">₹${(item.totalPrice ?? 0).toLocaleString("en-IN")}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <div style="text-align:right; font-size:14px;">
          <p style="margin:4px 0;">Subtotal: ₹${(bill.subtotal ?? 0).toLocaleString("en-IN")}</p>
          ${(bill.gstAmount ?? 0) > 0 ? `<p style="margin:4px 0;">GST (${bill.gstRate}%): ₹${(bill.gstAmount ?? 0).toLocaleString("en-IN")}</p>` : ""}
          ${(bill.discount ?? 0) > 0 ? `<p style="margin:4px 0; color:#16a34a;">Discount: -₹${(bill.discount ?? 0).toLocaleString("en-IN")}</p>` : ""}
          <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
            Total: ₹${(bill.totalAmount ?? 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>`).join("")

    win.document.write(`
      <html>
        <head><title>Print Bills</title>
        <style>@media print { body { margin: 0; } }</style>
        </head>
        <body style="background:#fff; padding:24px;">${html}</body>
      </html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
    setPrintPreviewOpen(false)
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    } catch { return dateStr }
  }

  const BillVersionTable = ({ items }: { items: Bill["items"] | BillSnapshot["items"] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Design</TableHead>
            <TableHead className="text-right">Boxes</TableHead>
            <TableHead className="text-right">Price/Box</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(items ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                No items in this version.
              </TableCell>
            </TableRow>
          ) : (
            (items ?? []).map((item, index) => (
              <TableRow key={item.id ?? index}>
                <TableCell className="font-medium text-sm">
                  {item.designName}{item.size ? ` (${item.size})` : ""}
                </TableCell>
                <TableCell className="text-right text-sm">{item.quantityBoxes}</TableCell>
                <TableCell className="text-right text-sm">₹{item.pricePerBox}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  ₹{(item.totalPrice ?? 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  const BillTotals = ({ bill }: { bill: Bill | BillSnapshot }) => (
    <div className="space-y-2 p-4 bg-muted rounded-lg">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <span>₹{(bill.subtotal ?? 0).toLocaleString()}</span>
      </div>
      {(bill.gstAmount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            GST ({bill.gstRate ?? 0}% {bill.gstType})
          </span>
          <span>₹{(bill.gstAmount ?? 0).toLocaleString()}</span>
        </div>
      )}
      {(bill.discount ?? 0) > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Discount</span>
          <span className="text-green-600">-₹{(bill.discount ?? 0).toLocaleString()}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-base border-t pt-2 mt-2">
        <span>Total Amount</span>
        <span>₹{(bill.totalAmount ?? 0).toLocaleString()}</span>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading bills...</p>
      </div>
    )
  }

  // Timeline filter button labels
  const timeFilterOptions = [
    { value: "all",       label: "All" },
    { value: "today",     label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week",      label: "This Week" },
    { value: "month",     label: "This Month" },
    { value: "custom",    label: "Custom Range" },
  ]

  return (
    <div className="min-h-screen bg-background">

      {/* ── Toasts ──────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm w-full pointer-events-auto transition-all
            ${t.variant === "success" ? "bg-white border-green-200 text-green-900" : "bg-white border-red-200 text-red-900"}`}>
            {t.variant === "success"
              ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />}
            <div>
              <p className="font-medium text-sm">{t.message}</p>
              {t.description && <p className="text-xs mt-0.5 opacity-75">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>

      <NavigationHeader
        items={[{ label: "Bills & Invoices" }]}
        title="Bills & Invoices"
        description="View and manage customer invoices"
      />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              {/* Top row: title + search + export */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>All Bills</CardTitle>
                  <CardDescription>
                    {timeFilteredBills.length} bill{timeFilteredBills.length !== 1 ? "s" : ""}
                    {timeFilter !== "all" && " (filtered)"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Bills
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium">Export Bills</h4>
                          <p className="text-sm text-muted-foreground">Download bills in Excel format</p>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="export_type">Export By</Label>
                            <Select value={exportType} onValueChange={setExportType}>
                              <SelectTrigger id="export_type">
                                <SelectValue placeholder="Select export type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Bills</SelectItem>
                                <SelectItem value="month">Past Month</SelectItem>
                                <SelectItem value="year">Past Year</SelectItem>
                                <SelectItem value="custom">Custom Date Range</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {exportType === "custom" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                              </div>
                            </>
                          )}
                          <Button className="w-full" disabled={!exportType}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bills..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline filter dropdown */}
              <div className="flex items-center gap-2">
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeFilterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ NEW: Custom date range inputs (shown only when Custom Range is selected) */}
              {timeFilter === "custom" && (
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">From:</Label>
                    <Input
                      type="date"
                      className="w-40"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">To:</Label>
                    <Input
                      type="date"
                      className="w-40"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                  {(customStart || customEnd) && (
                    <Button variant="ghost" size="sm" onClick={() => { setCustomStart(""); setCustomEnd("") }} className="text-muted-foreground">
                      <X className="h-3.5 w-3.5 mr-1" />Clear dates
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* ✅ NEW: Bulk action bar — appears when any bill is selected */}
            {someSelected && (
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-muted rounded-lg border">
                <span className="text-sm font-medium">
                  {selectedIds.size} bill{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3.5 w-3.5 mr-1" />Deselect All
                  </Button>
                 <Button variant="outline" size="sm" onClick={handlePrintSelectedWithPreview}>
                    <Printer className="h-3.5 w-3.5 mr-1" />Print Selected ({selectedIds.size})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />Delete Selected ({selectedIds.size})
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* ✅ NEW: Select-all checkbox */}
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisible}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeFilteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchQuery || timeFilter !== "all"
                          ? "No bills match your filters."
                          : "No bills found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeFilteredBills.map((bill) => {
                      const isSelected = selectedIds.has(idKey(bill.id))
                      return (
                        <TableRow key={bill.id} className={isSelected ? "bg-muted/40" : ""}>
                          {/* ✅ NEW: Per-row checkbox */}
                          <TableCell
                            onClick={(e) => { e.stopPropagation(); toggleSelect(bill.id) }}
                            className="cursor-pointer"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                              aria-label={`Select ${bill.billNumber}`}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-medium">
                            <div className="flex items-center gap-2">
                              {bill.billNumber}
                              {bill.isEdited && (
                                <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 font-normal">
                                  Edited
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{bill.customerName}</TableCell>
                          <TableCell>{bill.phoneNumber}</TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{(bill.totalAmount ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(bill.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="icon" variant="ghost" title="View Bill" onClick={() => handleViewBill(bill)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* ✅ UPDATED: Print button now actually prints this bill */}
                              <Button size="icon" variant="ghost" title="Print Bill" onClick={() => handlePrintSingleBill(bill)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Link href={`/bills/edit/${bill.id}`}>
                                <Button size="icon" variant="ghost" title="Edit Bill">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Delete Bill"
                                onClick={() => handleDeleteClick(bill)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Showing Bills</p>
                <p className="text-2xl font-bold">{timeFilteredBills.length}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Bills This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {bills.filter((b) => {
                    if (!b.createdAt) return false
                    const d = new Date(b.createdAt)
                    const now = new Date()
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Revenue (Filtered)</p>
                <p className="text-2xl font-bold">
                  ₹{timeFilteredBills.reduce((acc, b) => acc + (b.totalAmount ?? 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ── Single Delete Confirmation Dialog ─────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) setDeleteDialogOpen(open) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Bill
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-1">
              <span className="block">
                Are you sure you want to delete bill{" "}
                <span className="font-semibold text-foreground">{billToDelete?.billNumber}</span>?
              </span>
              <span className="block text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm mt-2">
                ⚠️ This will permanently delete the bill and <strong>restore the sold boxes back to inventory</strong>.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete Bill"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ NEW: Bulk Delete Confirmation Dialog ──────────────────────────── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!bulkDeleting) setBulkDeleteOpen(open) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete {selectedIds.size} Bill{selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-1">
              <span className="block">
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">{selectedIds.size} bill{selectedIds.size !== 1 ? "s" : ""}</span>.
              </span>
              <span className="block text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm mt-2">
                ⚠️ Stock will be restored for all deleted bills. This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDeleteConfirm} disabled={bulkDeleting}>
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Bill${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Invoice Dialog ───────────────────────────────────────────── */}
      <Dialog open={viewBillOpen} onOpenChange={setViewBillOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Invoice — {selectedBill?.billNumber}
              {selectedBill?.isEdited && (
                <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 font-normal ml-1">
                  Edited
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Created: {selectedBill?.createdAt ? formatDate(selectedBill.createdAt) : ""}
              {selectedBill?.isEdited && selectedBill.editedAt && (
                <span className="ml-3 text-orange-600 font-medium text-xs">
                  Last edited: {formatDate(selectedBill.editedAt)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-semibold text-green-700">
                  Current Version
                  {selectedBill.isEdited && (
                    <span className="ml-2 font-normal text-muted-foreground text-xs">
                      (last edited {formatDate(selectedBill.editedAt)})
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Customer Name</p>
                  <p className="font-medium">{selectedBill.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <p className="font-medium">{selectedBill.phoneNumber}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <BillVersionTable items={selectedBill.items} />
              </div>

              <BillTotals bill={selectedBill} />

              {selectedBill.isEdited && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pt-1">
                    <History className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">Edit History</span>
                    <span className="text-xs text-muted-foreground">
                      — {(selectedBill.editHistory ?? []).length > 0
                        ? `${(selectedBill.editHistory ?? []).length} previous version${(selectedBill.editHistory ?? []).length !== 1 ? "s" : ""}`
                        : "This bill has been edited"}
                    </span>
                  </div>

                  {(selectedBill.editHistory ?? []).length === 0 ? (
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      This bill was edited on{" "}
                      <span className="font-medium">{formatDate(selectedBill.editedAt)}</span>.
                    </div>
                  ) : (
                    [...(selectedBill.editHistory ?? [])].reverse().map((snapshot, idx) => {
                      const isOpen = expandedSnapshot === idx
                      const versionLabel = `Version ${(selectedBill.editHistory ?? []).length - idx}`
                      return (
                        <div key={idx} className="rounded-lg border border-orange-200 overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                            onClick={() => setExpandedSnapshot(isOpen ? null : idx)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-orange-800">{versionLabel}</span>
                                <span className="ml-3 text-xs text-muted-foreground">
                                  Saved on {formatDate(snapshot.snapshotAt)}
                                </span>
                              </div>
                              {snapshot.editNote && (
                                <span className="text-xs italic text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                  "{snapshot.editNote}"
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-semibold text-orange-800">
                                ₹{(snapshot.totalAmount ?? 0).toLocaleString()}
                              </span>
                              {isOpen ? <ChevronUp className="h-4 w-4 text-orange-500" /> : <ChevronDown className="h-4 w-4 text-orange-500" />}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="p-4 space-y-4 bg-white border-t border-orange-100">
                              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Customer Name</p>
                                  <p className="font-medium text-sm">{snapshot.customerName}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                                  <p className="font-medium text-sm">{snapshot.phoneNumber}</p>
                                </div>
                              </div>
                              <BillVersionTable items={snapshot.items} />
                              <BillTotals bill={snapshot} />
                              <div className="flex justify-end pt-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-700 border-orange-300 hover:bg-orange-50"
                                  onClick={() => selectedBill && handlePrintSnapshot(snapshot, selectedBill)}
                                >
                                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                                  Print this version
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setViewBillOpen(false)}>Close</Button>
            {/* ✅ UPDATED: Print button in view dialog now actually prints */}
            <Button className="flex-1" onClick={() => selectedBill && handlePrintSingleBill(selectedBill)}>
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Print Bills Dialog (existing, kept for bill-number specific print) ── */}
      <Dialog open={printBillOpen} onOpenChange={setPrintBillOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Print Bills</DialogTitle>
            <DialogDescription>Select which bills to print</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="print_option">Print Option</Label>
              <Select value={printOption} onValueChange={setPrintOption}>
                <SelectTrigger id="print_option">
                  <SelectValue placeholder="Select print option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill_number">Specific Bill Number</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {printOption === "bill_number" && (
              <div className="space-y-2">
                <Label htmlFor="print_bill_number">Bill Number</Label>
                <Input
                  id="print_bill_number"
                  placeholder="Enter bill number"
                  value={printBillNumber}
                  onChange={(e) => setPrintBillNumber(e.target.value)}
                />
              </div>
            )}
            {printOption === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setPrintBillOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={!printOption}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── Print Preview Dialog ─────────────────────────────────────────── */}
      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print Preview
            </DialogTitle>
            <DialogDescription>
              {billToPrint
                ? `Review bill ${billToPrint.billNumber} before printing`
                : `Review ${printSelectedBills.length} bill${printSelectedBills.length !== 1 ? "s" : ""} before printing`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {(billToPrint ? [billToPrint] : printSelectedBills).map((bill) => (
              <div key={bill.id} className="border rounded-lg p-4 font-sans text-sm">
                <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold">INVOICE</h3>
                    <p className="text-xs text-muted-foreground">Bill No: <strong>{bill.billNumber}</strong></p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Date: {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}</p>
                    {bill.isEdited && <p className="text-orange-600 mt-1">⚠ Edited</p>}
                  </div>
                </div>
                <div className="mb-3 text-sm">
                  <p><strong>Customer:</strong> {bill.customerName}</p>
                  <p><strong>Phone:</strong> {bill.phoneNumber}</p>
                </div>
                <table className="w-full border-collapse text-xs mb-3">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border p-2 text-left">Design</th>
                      <th className="border p-2 text-right">Boxes</th>
                      <th className="border p-2 text-right">Price/Box</th>
                      <th className="border p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bill.items ?? []).map((item, i) => (
                      <tr key={i}>
                        <td className="border p-2">{item.designName}{item.size ? ` (${item.size})` : ""}</td>
                        <td className="border p-2 text-right">{item.quantityBoxes}</td>
                        <td className="border p-2 text-right">₹{item.pricePerBox}</td>
                        <td className="border p-2 text-right">₹{(item.totalPrice ?? 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right text-sm space-y-1">
                  <p>Subtotal: ₹{(bill.subtotal ?? 0).toLocaleString("en-IN")}</p>
                  {(bill.gstAmount ?? 0) > 0 && <p>GST ({bill.gstRate}%): ₹{(bill.gstAmount ?? 0).toLocaleString("en-IN")}</p>}
                  {(bill.discount ?? 0) > 0 && <p className="text-green-600">Discount: -₹{(bill.discount ?? 0).toLocaleString("en-IN")}</p>}
                  <p className="font-bold text-base border-t pt-2">Total: ₹{(bill.totalAmount ?? 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setPrintPreviewOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => executePrint(billToPrint ? [billToPrint] : printSelectedBills)}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}