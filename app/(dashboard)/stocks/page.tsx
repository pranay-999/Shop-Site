"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Trash2, Package, FileText, X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { getStocks, deleteStock, getBillsForStock } from "@/lib/services/stocks"
import type { Stock } from "@/lib/types"

type ToastType = { id: number; message: string; description?: string; variant: "success" | "error" }

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  const [toasts, setToasts] = useState<ToastType[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterSize, setFilterSize] = useState("all")
  // ✅ NEW: Sort order — "latest" shows newest added first, "az" sorts A→Z
  const [sortOrder, setSortOrder] = useState<"latest" | "az">("latest")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [stockToDelete, setStockToDelete] = useState<Stock | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [billsDialogOpen, setBillsDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [stockBills, setStockBills] = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(false)

  const showToast = (message: string, variant: "success" | "error", description?: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, description, variant }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const data = await getStocks()
        setStocks(data)
      } catch {
        showToast("Could not load inventory", "error", "Make sure the backend server is running.")
      } finally {
        setLoading(false)
      }
    }
    loadStocks()
  }, [])

  const uniqueTypes = useMemo(() => {
    const types = stocks.map((s) => s.type).filter(Boolean)
    return Array.from(new Set(types)).sort()
  }, [stocks])

  const uniqueSizes = useMemo(() => {
    const sizes = stocks.map((s) => s.size).filter(Boolean)
    return Array.from(new Set(sizes)).sort()
  }, [stocks])

  // ✅ UPDATED: filteredStocks now also sorts based on sortOrder
  const filteredStocks = useMemo(() => {
    const filtered = stocks.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.designName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === "all" || s.type === filterType
      const matchesSize = filterSize === "all" || s.size === filterSize
      return matchesSearch && matchesType && matchesSize
    })

    if (sortOrder === "az") {
      // Alphabetical A → Z by design name
      return [...filtered].sort((a, b) => a.designName.localeCompare(b.designName))
    }
    // Default: latest added first (by createdAt descending)
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    )
  }, [stocks, searchQuery, filterType, filterSize, sortOrder])

  const hasActiveFilters = searchQuery || filterType !== "all" || filterSize !== "all"

  const clearFilters = () => {
    setSearchQuery("")
    setFilterType("all")
    setFilterSize("all")
  }

  const handleDeleteClick = (stock: Stock) => {
    setStockToDelete(stock)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!stockToDelete) return
    setDeleting(true)
    try {
      await deleteStock(stockToDelete.id)
      setStocks(stocks.filter((s) => s.id !== stockToDelete.id))
      setDeleteDialogOpen(false)
      setStockToDelete(null)
      showToast("Stock item deleted", "success", "The item has been removed from inventory.")
    } catch {
      setDeleteDialogOpen(false)
      showToast(
        "Could not delete item",
        "error",
        "This item may be linked to existing bills. Remove those bills first."
      )
    } finally {
      setDeleting(false)
    }
  }

  const idKey = (id: number) => String(id)

  const allVisibleSelected =
    filteredStocks.length > 0 && filteredStocks.every((s) => selectedIds.has(idKey(s.id)))
  const someSelected = selectedIds.size > 0

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredStocks.forEach((s) => next.delete(idKey(s.id)))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        filteredStocks.forEach((s) => next.add(idKey(s.id)))
        return next
      })
    }
  }

  const toggleSelect = (id: number) => {
    const key = idKey(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(selectedIds).map(Number)
    let failed = 0
    for (const id of ids) {
      try { await deleteStock(id) } catch { failed++ }
    }
    setStocks((prev) => prev.filter((s) => !selectedIds.has(idKey(s.id))))
    setSelectedIds(new Set())
    setBulkDeleteOpen(false)
    setBulkDeleting(false)
    if (failed > 0) {
      showToast(`${ids.length - failed} deleted, ${failed} failed`, "error", "Some items may be linked to bills.")
    } else {
      showToast(`${ids.length} item${ids.length !== 1 ? "s" : ""} deleted`, "success", "Selected items removed from inventory.")
    }
  }

  const handleViewBills = async (stock: Stock) => {
    setSelectedStock(stock)
    setStockBills([])
    setBillsDialogOpen(true)
    setLoadingBills(true)
    try {
      const bills = await getBillsForStock(stock.designName)
      setStockBills(bills)
    } catch {
      setStockBills([])
    } finally {
      setLoadingBills(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border max-w-sm w-full pointer-events-auto transition-all duration-300
              ${toast.variant === "success"
                ? "bg-white border-green-200 text-green-900"
                : "bg-white border-red-200 text-red-900"
              }`}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="font-medium text-sm">{toast.message}</p>
              {toast.description && (
                <p className="text-xs mt-0.5 opacity-75">{toast.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <NavigationHeader
        items={[{ label: "Stock Management" }]}
        title="Stock Management"
        description="Manage your tiles and sanitary inventory"
        action={
          <Button asChild>
            <Link href="/stocks/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Link>
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Stock Items</CardTitle>
                <CardDescription>
                  {filteredStocks.length} of {stocks.length} items
                  {hasActiveFilters && " (filtered)"}
                </CardDescription>
              </div>

              {/* Search + Sort row */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search design name..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* ✅ NEW: Sort order toggle */}
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "latest" | "az")}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="az">A → Z</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Bulk action bar */}
            {someSelected && (
              <div className="flex items-center justify-between mb-3 px-3 py-2 bg-muted rounded-lg border">
                <span className="text-sm font-medium">{selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-3.5 w-3.5 mr-1" />Deselect All
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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>

                    <TableHead>Design Name</TableHead>

                    <TableHead>
                      <div className="flex items-center gap-1.5">
                        <span>Type</span>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs border-dashed px-2 py-0 font-normal">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {uniqueTypes.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>

                    <TableHead>
                      <div className="flex items-center gap-1.5">
                        <span>Size</span>
                        <Select value={filterSize} onValueChange={setFilterSize}>
                          <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs border-dashed px-2 py-0 font-normal">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sizes</SelectItem>
                            {uniqueSizes.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableHead>

                    <TableHead className="text-right">Initial</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredStocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                        {hasActiveFilters ? "No items match your filters." : "No stock items found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStocks.map((stock) => {
                      const initial   = stock.initialBoxes ?? 0
                      const sold      = stock.soldBoxes    ?? 0
                      const remaining = stock.totalBoxes   ?? 0
                      const isSelected = selectedIds.has(idKey(stock.id))

                      return (
                        <TableRow
                          key={stock.id}
                          className={isSelected ? "bg-muted/40" : ""}
                        >
                          <TableCell
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelect(stock.id)
                            }}
                            className="cursor-pointer"
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {}}
                              aria-label={`Select ${stock.designName}`}
                            />
                          </TableCell>

                          <TableCell className="font-medium">{stock.designName}</TableCell>
                          <TableCell>{stock.type}</TableCell>
                          <TableCell>{stock.size}</TableCell>

                          <TableCell className="text-right text-muted-foreground">
                            {initial}
                          </TableCell>

                          <TableCell className="text-right">
                            {sold > 0 ? (
                              <span className="text-orange-600 font-medium">{sold}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right font-medium">{remaining}</TableCell>

                          <TableCell>
                            {remaining < 10 ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : remaining < 30 ? (
                              <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>
                            ) : (
                              <Badge variant="outline" className="border-green-500 text-green-600">In Stock</Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewBills(stock)}
                                title="View sales history for this item"
                              >
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                History
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteClick(stock)}
                                title="Delete stock item"
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

            {/* Summary cards */}
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-xl font-bold">{filteredStocks.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Initial (Boxes)</p>
                  <p className="text-xl font-bold text-blue-600">
                    {filteredStocks.reduce((acc, s) => acc + (s.initialBoxes ?? 0), 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Sold (Boxes)</p>
                  <p className="text-xl font-bold text-orange-600">
                    {filteredStocks.reduce((acc, s) => acc + (s.soldBoxes ?? 0), 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Remaining (Boxes)</p>
                  <p className="text-xl font-bold text-green-600">
                    {filteredStocks.reduce((acc, s) => acc + (s.totalBoxes ?? 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* ── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { if (!deleting) setDeleteDialogOpen(open) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Stock Item
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">
                {stockToDelete?.designName}
              </span>
              {stockToDelete && (
                <span className="text-muted-foreground">
                  {" "}({stockToDelete.size} · {stockToDelete.type})
                </span>
              )}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!bulkDeleting) setBulkDeleteOpen(open) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete {selectedIds.size} Item{selectedIds.size !== 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will permanently delete <span className="font-semibold text-foreground">{selectedIds.size} stock item{selectedIds.size !== 1 ? "s" : ""}</span>.
              Items linked to existing bills cannot be deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkDeleteConfirm} disabled={bulkDeleting}>
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Item${selectedIds.size !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sales History Dialog ───────────────────────────────────────────── */}
      <Dialog open={billsDialogOpen} onOpenChange={setBillsDialogOpen}>
        <DialogContent className="sm:max-w-[680px] max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Sales History — {selectedStock?.designName}
            </DialogTitle>
            <DialogDescription>
              {selectedStock?.size} · {selectedStock?.type} ·{" "}
              {selectedStock ? (
                <span>
                  <span className="text-orange-600 font-medium">{selectedStock.soldBoxes ?? 0} boxes sold</span>
                  {" "}out of <span className="font-medium">{selectedStock.initialBoxes ?? 0} initial</span>
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-2">
            {loadingBills ? (
              <p className="text-center text-muted-foreground py-8">Loading history...</p>
            ) : stockBills.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">No sales history yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">This item has not been sold in any bill.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Boxes</TableHead>
                      <TableHead className="text-right">Price/Box</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Date & Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockBills.map((bill: any) => {
                      const matchedItem = bill.items?.find(
                        (item: any) =>
                          item.designName?.toLowerCase().trim() === selectedStock?.designName?.toLowerCase().trim()
                      )
                      const createdAt = bill.createdAt ? new Date(bill.createdAt) : null
                      return (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono font-medium text-sm">
                            {bill.billNumber}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{bill.customerName}</div>
                            {bill.phoneNumber && (
                              <div className="text-xs text-muted-foreground">{bill.phoneNumber}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {matchedItem?.quantityBoxes ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {matchedItem?.pricePerBox ? `₹${matchedItem.pricePerBox}` : "—"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">
                            ₹{(matchedItem?.totalPrice ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {createdAt ? (
                              <div>
                                <div>{createdAt.toLocaleDateString("en-IN")}</div>
                                <div className="text-xs">{createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                              </div>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center px-4 py-3 bg-muted/40 border-t text-sm font-medium">
                  <span className="text-muted-foreground">
                    {stockBills.length} bill{stockBills.length !== 1 ? "s" : ""}
                  </span>
                  <span>
                    Total sold: ₹{stockBills.reduce((sum, bill) => {
                      const item = bill.items?.find(
                        (i: any) => i.designName?.toLowerCase().trim() === selectedStock?.designName?.toLowerCase().trim()
                      )
                      return sum + (item?.totalPrice ?? 0)
                    }, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => setBillsDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}