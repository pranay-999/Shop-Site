"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Eye, Printer, Edit, Trash2, Download, AlertTriangle, CheckCircle2, History, ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
  // Which history snapshot is expanded (-1 = none, 0 = first/oldest, etc.)
  const [expandedSnapshot, setExpandedSnapshot] = useState<number | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [exportType, setExportType] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [printBillOpen, setPrintBillOpen] = useState(false)
  const [printOption, setPrintOption] = useState<string>("")
  const [printBillNumber, setPrintBillNumber] = useState("")

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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-"
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    } catch { return dateStr }
  }

  // ── Renders one version of a bill (current or historical snapshot) ──────────
  const BillVersionTable = ({ items }: { items: Bill["items"] | BillSnapshot["items"] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Design</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Boxes</TableHead>
            <TableHead className="text-right">Price/Box</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(items ?? []).length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                No items in this version.
              </TableCell>
            </TableRow>
          ) : (
            (items ?? []).map((item, index) => (
              <TableRow key={item.id ?? index}>
                <TableCell className="font-medium text-sm">{item.designName}</TableCell>
                <TableCell className="text-sm">{item.size}</TableCell>
                <TableCell className="text-sm">{item.type}</TableCell>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Bills</CardTitle>
                <CardDescription>View and manage customer invoices</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setPrintBillOpen(true)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bills
                </Button>

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
                    placeholder="Search by bill number..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No bills match your search." : "No bills found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => (
                      <TableRow key={bill.id}>
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
                            <Button size="icon" variant="ghost" title="Print Bill">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Bills</p>
                <p className="text-2xl font-bold">{bills.length}</p>
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
                <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ₹{bills.reduce((acc, b) => acc + (b.totalAmount ?? 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
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

              {/* Current version header */}
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

              {/* Customer info */}
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

              {/* Current items */}
              <div>
                <p className="text-sm font-medium mb-2">Items</p>
                <BillVersionTable items={selectedBill.items} />
              </div>

              {/* Current totals */}
              <BillTotals bill={selectedBill} />

              {/* ── Edit History ────────────────────────────────────────────── */}
              {selectedBill.isEdited && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pt-1">
                    <History className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">Edit History</span>
                    <span className="text-xs text-muted-foreground">
                      — {(selectedBill.editHistory ?? []).length > 0
                        ? `${(selectedBill.editHistory ?? []).length} previous version${(selectedBill.editHistory ?? []).length !== 1 ? "s" : ""}`
                        : "This bill has been edited (previous versions not stored yet)"}
                    </span>
                  </div>

                  {(selectedBill.editHistory ?? []).length === 0 ? (
                    /* If your backend doesn't yet return editHistory, show a simple note */
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                      This bill was edited on{" "}
                      <span className="font-medium">{formatDate(selectedBill.editedAt)}</span>.
                      Detailed version history will appear here once your backend stores snapshots.
                    </div>
                  ) : (
                    /* Show each historical snapshot, collapsible */
                    [...(selectedBill.editHistory ?? [])].reverse().map((snapshot, idx) => {
                      const isOpen = expandedSnapshot === idx
                      const versionLabel = `Version ${(selectedBill.editHistory ?? []).length - idx}`
                      return (
                        <div key={idx} className="rounded-lg border border-orange-200 overflow-hidden">
                          {/* Snapshot header — click to expand/collapse */}
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
                              {isOpen
                                ? <ChevronUp className="h-4 w-4 text-orange-500" />
                                : <ChevronDown className="h-4 w-4 text-orange-500" />
                              }
                            </div>
                          </button>

                          {/* Expanded snapshot details */}
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
            <Button className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Print Bills Dialog ─────────────────────────────────────────────── */}
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
    </div>
  )
}