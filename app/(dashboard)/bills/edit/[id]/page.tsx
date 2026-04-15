"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2, Edit, AlertCircle, Save, Loader2, RefreshCw, Printer } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { getStocks } from "@/lib/services/stocks"
import { API_BASE } from "@/lib/api"
import type { Stock } from "@/lib/types"

interface CartItem {
  id: string
  stockId: number
  design_name: string
  size: string
  type: string
  boxes: number
  originalBoxes: number  // boxes when bill was first loaded — for stock delta on save
  pricePerBox: number    // display price (may be GST-adjusted for INCLUSIVE)
  total: number
}

export default function EditBillPage() {
  const router = useRouter()
  const params = useParams()
  const billId = params?.id as string

  const [pageLoading, setPageLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const [billData, setBillData] = useState({
    bill_number: "",
    customer_name: "",
    customer_phone: "",
  })

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  // Tracks items removed during edit so we can restore their boxes to inventory on save
  const [removedItems, setRemovedItems] = useState<{ stockId: number; boxes: number }[]>([])

  // Stores the ORIGINAL price the user entered (before any GST adjustment)
  // Key = CartItem.id, Value = original price per box
  const [baseCartPrices, setBaseCartPrices] = useState<Record<string, number>>({})

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editBoxes, setEditBoxes] = useState("")
  const [editPrice, setEditPrice] = useState("")

  const [allStocks, setAllStocks] = useState<Stock[]>([])
  const [loadingStocks, setLoadingStocks] = useState(false)

  // Add-new-item panel
  const [showAddItem, setShowAddItem] = useState(false)
  const [newDesignName, setNewDesignName] = useState("")
  const [newDesignSuggestions, setNewDesignSuggestions] = useState<Stock[]>([])
  const [selectedNewStock, setSelectedNewStock] = useState<Stock | null>(null)
  const [newSize, setNewSize] = useState("")
  const [newType, setNewType] = useState("")
  const [newAvailableBoxes, setNewAvailableBoxes] = useState<number | null>(null)
  const [newBoxes, setNewBoxes] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [duplicateError, setDuplicateError] = useState("")
  const [addItemError, setAddItemError] = useState("")
  const designInputRef = useRef<HTMLInputElement>(null)

  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [gstType, setGstType] = useState<"exclusive" | "inclusive">("exclusive")

  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [saveError, setSaveError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")
  const [printAfterSaveOpen, setPrintAfterSaveOpen] = useState(false)
  const [savedBillData, setSavedBillData] = useState<{ billNumber: string; 
    customerName: string; phoneNumber: string; items: typeof cartItems; 
    subtotal: number; gstAmount: number; gstRate: string;
     gstType: string; finalTotal: number } | null>(null)

  // ── Fetch fresh stock list ────────────────────────────────────────────────
  const refreshStocks = useCallback(async () => {
    setLoadingStocks(true)
    try {
      const data = await getStocks()
      setAllStocks(data)
    } catch {
      console.warn("Could not refresh stocks")
    } finally {
      setLoadingStocks(false)
    }
  }, [])

  useEffect(() => { refreshStocks() }, [refreshStocks])

  // ── Load bill by URL id ───────────────────────────────────────────────────
  useEffect(() => {
    if (!billId) {
      setLoadError("No bill ID found in URL.")
      setPageLoading(false)
      return
    }
    const loadBill = async () => {
      try {
        const res = await fetch(`${API_BASE}/bills/${billId}`)
        if (!res.ok) {
          setLoadError(`Could not find bill with ID "${billId}". It may have been deleted.`)
          setPageLoading(false)
          return
        }
        const bill = await res.json()
        setBillData({
          bill_number:    bill.billNumber,
          customer_name:  bill.customerName,
          customer_phone: bill.phoneNumber,
        })

        // Build cartItems from the bill's saved items
        const items: CartItem[] = (bill.items ?? []).map((item: any) => ({
          id:            String(item.id),
          stockId:       item.stockId ?? 0,
          design_name:   item.designName,
          size:          item.size,
          type:          item.type,
          boxes:         item.quantityBoxes,
          originalBoxes: item.quantityBoxes,
          pricePerBox:   item.pricePerBox,  // this is the original price stored in DB
          total:         item.totalPrice,
        }))
        setCartItems(items)

        // Populate baseCartPrices from the DB-stored original prices
        const basePrices: Record<string, number> = {}
        items.forEach((item) => { basePrices[item.id] = item.pricePerBox })
        setBaseCartPrices(basePrices)

        // Restore GST settings from the saved bill
        if (bill.gstRate && bill.gstRate > 0) {
          setGstEnabled(true)
          setGstRate(String(bill.gstRate))
          const savedType = bill.gstType === "INCLUSIVE" ? "inclusive" : "exclusive"
          setGstType(savedType)

          // If the bill was saved as inclusive, adjust display prices now
          if (savedType === "inclusive") {
            const rate = bill.gstRate / 100
            const adjustedItems = items.map((item) => {
              const displayPrice = Math.round((item.pricePerBox / (1 + rate)) * 100) / 100
              return { ...item, pricePerBox: displayPrice, total: Math.round(item.boxes * displayPrice * 100) / 100 }
            })
            setCartItems(adjustedItems)
          }
        }
      } catch {
        setLoadError("Could not connect to server. Make sure the backend is running.")
      } finally {
        setPageLoading(false)
      }
    }
    loadBill()
  }, [billId])

  // ── GST change: re-adjust display prices using baseCartPrices ────────────
  // This is the KEY fix: when GST is toggled off or type changes,
  // we always revert to the original price from baseCartPrices
  useEffect(() => {
    if (cartItems.length === 0) return
    const rate = Number.parseFloat(gstRate) || 0
    setCartItems((prev) => prev.map((item) => {
      const originalPrice = baseCartPrices[item.id] ?? item.pricePerBox
      const displayPrice = Math.round(
        (gstEnabled && gstType === "inclusive" ? originalPrice / (1 + rate / 100) : originalPrice) * 100
      ) / 100
      return { ...item, pricePerBox: displayPrice, total: Math.round(item.boxes * displayPrice * 100) / 100 }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstEnabled, gstType, gstRate])

  // ── Add Item panel ────────────────────────────────────────────────────────
  const handleOpenAddItem = () => {
    refreshStocks()
    setShowAddItem(true)
    setDuplicateError("")
    setAddItemError("")
  }

  const handleCloseAddItem = () => {
    setShowAddItem(false)
    setNewDesignName(""); setNewSize(""); setNewType("")
    setNewBoxes(""); setNewPrice("")
    setNewAvailableBoxes(null); setSelectedNewStock(null)
    setNewDesignSuggestions([])
    setDuplicateError(""); setAddItemError("")
  }

  const handleDesignNameChange = (value: string) => {
    setNewDesignName(value)
    setSelectedNewStock(null)
    setNewSize(""); setNewType(""); setNewAvailableBoxes(null); setNewPrice("")
    setDuplicateError(""); setAddItemError("")
    if (!value.trim()) { setNewDesignSuggestions([]); return }
    const lower = value.toLowerCase()
    setNewDesignSuggestions(allStocks.filter((s) => s.designName.toLowerCase().includes(lower)).slice(0, 8))
  }

  const handleSelectSuggestion = (stock: Stock) => {
    setSelectedNewStock(stock)
    setNewDesignName(stock.designName)
    setNewSize(stock.size)
    setNewType(stock.type)
    setNewAvailableBoxes(stock.totalBoxes)
    setNewPrice(stock.pricePerBox > 0 ? String(stock.pricePerBox) : "")
    setNewDesignSuggestions([])
    setDuplicateError("")

    const alreadyInBill = cartItems.some(
      (item) => item.design_name.toLowerCase() === stock.designName.toLowerCase() &&
                item.size.toLowerCase() === stock.size.toLowerCase()
    )
    if (alreadyInBill) {
      setDuplicateError(`"${stock.designName}" (${stock.size}) is already in this bill. Edit the existing row instead.`)
    }
    setTimeout(() => document.getElementById("new_boxes")?.focus(), 50)
  }

  // ── Inline edit existing items ────────────────────────────────────────────
  const handleEditItem = (item: CartItem) => {
    setEditingItemId(item.id)
    setEditBoxes(item.boxes.toString())
    // Show the original price in the edit field, not the GST-adjusted display price
    setEditPrice((baseCartPrices[item.id] ?? item.pricePerBox).toString())
  }

  const handleUpdateItem = (id: string) => {
    const boxes = Number.parseInt(editBoxes)
    const pricePerBox = Number.parseFloat(editPrice)
    if (!boxes || boxes <= 0 || !pricePerBox || pricePerBox <= 0) {
      setSaveError("Please enter valid values")
      return
    }
    setSaveError("")
    // Update base price tracker with the new price the user entered
    setBaseCartPrices((prev) => ({ ...prev, [id]: pricePerBox }))

    // Compute display price based on current GST setting
    const rate = Number.parseFloat(gstRate) || 0
    const displayPrice = Math.round(
      (gstEnabled && gstType === "inclusive" ? pricePerBox / (1 + rate / 100) : pricePerBox) * 100
    ) / 100

    setCartItems(cartItems.map((item) =>
      item.id === id ? { ...item, boxes, pricePerBox: displayPrice, total: boxes * displayPrice } : item
    ))
    setEditingItemId(null)
    setEditBoxes(""); setEditPrice("")
  }

  const handleRemoveItem = (id: string) => {
    const removed = cartItems.find((item) => item.id === id)
    // If this item came from the original bill (has originalBoxes > 0), track it for stock restoration
    if (removed && removed.stockId && removed.originalBoxes > 0) {
      setRemovedItems((prev) => [...prev, { stockId: removed.stockId, boxes: removed.originalBoxes }])
    }
    setCartItems(cartItems.filter((item) => item.id !== id))
    setBaseCartPrices((prev) => { const u = { ...prev }; delete u[id]; return u; })
  }

  // ── Add new item ──────────────────────────────────────────────────────────
  const handleAddNewItem = () => {
    setAddItemError("")
    if (!newDesignName.trim() || !newSize.trim() || !newType.trim()) {
      setAddItemError("Please fill in Design Name, Size, and Type")
      return
    }
    const alreadyInBill = cartItems.some(
      (item) => item.design_name.toLowerCase() === newDesignName.trim().toLowerCase() &&
                item.size.toLowerCase() === newSize.trim().toLowerCase()
    )
    if (alreadyInBill) {
      setDuplicateError(`"${newDesignName}" (${newSize}) is already in this bill. Edit the existing row instead.`)
      return
    }
    const boxes = Number.parseInt(newBoxes)
    const price = Number.parseFloat(newPrice)
    if (!boxes || boxes <= 0) { setAddItemError("Please enter a valid number of boxes"); return }
    if (!price || price <= 0) { setAddItemError("Please enter a valid price per box"); return }

    if (newAvailableBoxes !== null && boxes > newAvailableBoxes) {
      if (!window.confirm(`Warning: You are adding ${boxes} boxes but only ${newAvailableBoxes} are available in stock.\n\nContinue anyway?`)) return
    }

    const itemId = `new-${Date.now()}`
    // Store the original price
    setBaseCartPrices((prev) => ({ ...prev, [itemId]: price }))

    // Compute display price based on current GST
    const rate = Number.parseFloat(gstRate) || 0
    const displayPrice = Math.round(
      (gstEnabled && gstType === "inclusive" ? price / (1 + rate / 100) : price) * 100
    ) / 100

    setCartItems([...cartItems, {
      id:            itemId,
      stockId:       selectedNewStock?.id ?? 0,
      design_name:   newDesignName.trim(),
      size:          newSize.trim(),
      type:          newType.trim(),
      boxes,
      originalBoxes: 0,
      pricePerBox:   displayPrice,
      total:         Math.round(boxes * displayPrice * 100) / 100,
    }])
    handleCloseAddItem()
  }

  // ── Save bill ─────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: string[] = []
    if (!billData.customer_name.trim()) errors.push("Customer name is required")
    if (!billData.customer_phone.trim()) errors.push("Phone number is required")
    if (cartItems.length === 0) errors.push("Add at least one item to the bill")
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSaveBill = async () => {
    if (!validateForm()) return
    setIsSaving(true)
    setSaveSuccess("")
    setSaveError("")

    try {
      const res = await fetch(`${API_BASE}/bills/${billData.bill_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNumber:   billData.bill_number,
          customerName: billData.customer_name,
          phoneNumber:  billData.customer_phone,
          subtotal,
          gstRate:      gstEnabled ? Number.parseFloat(gstRate) : 0,
          gstType:      gstEnabled ? gstType.toUpperCase() : "EXCLUSIVE",
          gstAmount,
          discount:     0,
          totalAmount:  finalTotal,
          // Always save ORIGINAL price (from baseCartPrices) to the DB
          items: cartItems.map((item) => ({
            designName:    item.design_name,
            size:          item.size,
            type:          item.type,
            quantityBoxes: item.boxes,
            pricePerBox:   baseCartPrices[item.id] ?? item.pricePerBox,
            totalPrice:    item.total,
            stockId:       item.stockId,
          })),
        }),
      })

      if (!res.ok) {
        setSaveError("Failed to save bill. Please try again.")
        setIsSaving(false)
        return
      }

      // Update inventory for changed/new items
      const stockUpdates: { stockId: number; delta: number }[] = []
      for (const item of cartItems) {
        if (!item.stockId) continue
        const diff = item.boxes - item.originalBoxes
        if (diff !== 0) stockUpdates.push({ stockId: item.stockId, delta: -diff })
      }
      // Restore boxes to inventory for items removed from this bill
      for (const removed of removedItems) {
        if (removed.stockId) stockUpdates.push({ stockId: removed.stockId, delta: removed.boxes })
      }

      await Promise.allSettled(
        stockUpdates.map(({ stockId, delta }) =>
          fetch(`${API_BASE}/stocks/${stockId}/adjust?delta=${delta}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
          })
        )
      )

      setRemovedItems([])
      setCartItems((prev) => prev.map((item) => ({ ...item, originalBoxes: item.boxes })))
      await refreshStocks()

      setSaveSuccess(`Bill ${billData.bill_number} updated successfully!`)
      setValidationErrors([])
      setSavedBillData({
        billNumber: billData.bill_number,
        customerName: billData.customer_name,
        phoneNumber: billData.customer_phone,
        items: cartItems,
        subtotal,
        gstAmount,
        gstRate,
        gstType,
        finalTotal,
      })
      setPrintAfterSaveOpen(true)
    } catch {
      setSaveError("Could not connect to server. Make sure the backend is running.")
    } finally {
      setIsSaving(false)
    }
  }
        const handlePrintSavedBill = () => {
    if (!savedBillData) return
    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(`
      <html>
        <head><title>Invoice - ${savedBillData.billNumber}</title>
        <style>@media print { body { margin: 0; } }</style>
        </head>
        <body style="background:#fff; padding:24px; font-family:Arial,sans-serif;">
          <div style="max-width:620px; margin:0 auto; border:1px solid #e0e0e0; padding:32px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
              <div>
                <h2 style="margin:0; font-size:22px;">INVOICE</h2>
                <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${savedBillData.billNumber}</strong></p>
              </div>
              <div style="text-align:right; font-size:13px; color:#555;">
                <p style="margin:0;">Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                <p style="margin:4px 0 0; color:#d97706;">⚠ Edited</p>
              </div>
            </div>
            <div style="margin-bottom:16px; font-size:14px;">
              <p style="margin:0;"><strong>Customer:</strong> ${savedBillData.customerName}</p>
              <p style="margin:4px 0 0;"><strong>Phone:</strong> ${savedBillData.phoneNumber}</p>
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
                ${savedBillData.items.map((item) => `
                  <tr>
                    <td>${item.design_name}${item.size ? ` (${item.size})` : ""}</td>
                    <td style="text-align:right;">${item.boxes}</td>
                    <td style="text-align:right;">₹${item.pricePerBox}</td>
                    <td style="text-align:right;">₹${item.total.toLocaleString("en-IN")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div style="text-align:right; font-size:14px;">
              <p style="margin:4px 0;">Subtotal: ₹${savedBillData.subtotal.toLocaleString("en-IN")}</p>
              ${savedBillData.gstAmount > 0 ? `<p style="margin:4px 0;">GST (${savedBillData.gstRate}%): ₹${savedBillData.gstAmount.toLocaleString("en-IN")}</p>` : ""}
              <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
                Total: ₹${savedBillData.finalTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </body>
      </html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
    setPrintAfterSaveOpen(false)
  }
  // ── Totals ────────────────────────────────────────────────────────────────
  // subtotal uses the DISPLAY price (which for inclusive is already GST-extracted)
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)
  let gstAmount = 0
  let finalTotal = subtotal
  if (gstEnabled && gstRate) {
    const rate = Number.parseFloat(gstRate) / 100
    if (gstType === "exclusive") {
      gstAmount = subtotal * rate
      finalTotal = subtotal + gstAmount
    } else {
      finalTotal = cartItems.reduce((sum, item) => {
        const originalPrice = baseCartPrices[item.id] ?? item.pricePerBox
        return sum + Math.round(originalPrice * item.boxes * 100) / 100
      }, 0)
      gstAmount = Math.round((finalTotal * rate) / (1 + rate) * 100) / 100
    }
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading bill...</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader
          items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
          title="Edit Bill" description="Could not load bill"
        />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button className="mt-4 w-full" variant="outline" onClick={() => router.push("/bills")}>
            Back to Bills
          </Button>
        </main>
      </div>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
        title="Edit Bill"
        description={`Bill Number: ${billData.bill_number}`}
        action={
          <Button onClick={handleSaveBill} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">

        <Card className="mb-6 max-w-4xl mx-auto">
          <CardHeader className="pb-4"><CardTitle>Bill Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bill Number</Label>
                <Input value={billData.bill_number} disabled />
              </div>
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={billData.customer_name} onChange={(e) => setBillData({ ...billData, customer_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input value={billData.customer_phone} onChange={(e) => setBillData({ ...billData, customer_phone: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-6xl mx-auto">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                    <CardDescription>Edit quantities or prices, or remove items</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleOpenAddItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                {/* ── Add New Item Panel ─────────────────────────────────── */}
                {showAddItem && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">New Item Details</p>
                      {loadingStocks && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Refreshing stock...
                        </span>
                      )}
                    </div>

                    {duplicateError && (
                      <div className="flex items-start gap-2 bg-orange-50 border border-orange-300 text-orange-800 rounded-md px-3 py-2 text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{duplicateError}</span>
                      </div>
                    )}

                    {addItemError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 rounded-md px-3 py-2 text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{addItemError}</span>
                      </div>
                    )}

                    <div className="space-y-1 relative">
                      <Label>Design Name *</Label>
                      <Input
                        ref={designInputRef}
                        placeholder="Start typing to search inventory..."
                        value={newDesignName}
                        onChange={(e) => handleDesignNameChange(e.target.value)}
                        autoComplete="off"
                      />
                      {newDesignSuggestions.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                          {newDesignSuggestions.map((stock) => (
                            <button
                              key={stock.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between gap-2"
                              onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(stock) }}
                            >
                              <span className="font-medium">{stock.designName}</span>
                              <span className="text-muted-foreground text-xs shrink-0">
                                {stock.size} · {stock.type} ·{" "}
                                <span className={stock.totalBoxes < 10 ? "text-red-500 font-semibold" : "text-green-600 font-semibold"}>
                                  {stock.totalBoxes} boxes
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Size *</Label>
                        <Input placeholder="e.g. 2x2" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Type *</Label>
                        <Input placeholder="e.g. Tile" value={newType} onChange={(e) => setNewType(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label>Available in Stock</Label>
                        <div className={`h-9 px-3 flex items-center rounded-md border text-sm font-medium ${
                          newAvailableBoxes === null ? "text-muted-foreground bg-muted/40"
                            : newAvailableBoxes < 10 ? "text-red-600 bg-red-50 border-red-200"
                            : "text-green-700 bg-green-50 border-green-200"
                        }`}>
                          {newAvailableBoxes === null ? "—" : `${newAvailableBoxes} boxes`}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>No. of Boxes *</Label>
                        <Input
                          id="new_boxes"
                          type="number" min={1} placeholder="0"
                          value={newBoxes}
                          onChange={(e) => setNewBoxes(e.target.value)}
                        />
                        {newAvailableBoxes !== null && Number(newBoxes) > newAvailableBoxes && (
                          <p className="text-xs text-red-500">Exceeds available stock ({newAvailableBoxes})</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label>Price per Box (₹) *</Label>
                        <Input
                          type="number" min={0} placeholder="0"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    {newBoxes && newPrice && Number(newBoxes) > 0 && Number(newPrice) > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">
                          ₹{(Number(newBoxes) * Number(newPrice)).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleAddNewItem} disabled={!!duplicateError}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add to Bill
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCloseAddItem}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">No items in this bill. Click "Add Item" to add one.</div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[45%]">Design</TableHead>
                          <TableHead className="w-[12%] text-right">Boxes</TableHead>
                          <TableHead className="w-[15%] text-right">
                            Price/Box
                            {gstEnabled && gstType === "inclusive" && (
                              <span className="text-xs text-muted-foreground ml-1">(excl.)</span>
                            )}
                          </TableHead>
                          <TableHead className="w-[15%] text-right">Total</TableHead>
                          <TableHead className="w-[8%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id}>
                            {editingItemId === item.id ? (
                              <>
                                <TableCell className="font-medium text-sm">
                                  {item.design_name}{item.size ? ` (${item.size})` : ""}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input type="number" value={editBoxes} onChange={(e) => setEditBoxes(e.target.value)} className="w-16 h-7 text-right text-sm" />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-20 h-7 text-right text-sm" />
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  ₹{(Number(editBoxes || 0) * Number(editPrice || 0)).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button size="sm" className="h-7 text-xs" onClick={() => handleUpdateItem(item.id)}>Save</Button>
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    {item.design_name}{item.size ? ` (${item.size})` : ""}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {item.boxes}
                                  {item.boxes !== item.originalBoxes && item.originalBoxes > 0 && (
                                    <div className="text-xs text-orange-500">was {item.originalBoxes}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  ₹{item.pricePerBox}
                                  {gstEnabled && gstType === "inclusive" && baseCartPrices[item.id] && (
                                    <div className="text-xs text-muted-foreground">orig: ₹{baseCartPrices[item.id]}</div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium text-sm">₹{item.total.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditItem(item)}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRemoveItem(item.id)}>
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right — Summary */}
          <Card className="h-fit">
            <CardHeader><CardTitle>Bill Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {saveSuccess && (
                <div className="bg-green-50 border border-green-300 text-green-800 rounded-md p-3 text-sm font-medium">
                  ✅ {saveSuccess}
                </div>
              )}

              {saveError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">Please fix the following:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validationErrors.map((error, i) => <li key={i}>{error}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="gst" checked={gstEnabled} onCheckedChange={(c) => { setGstEnabled(c as boolean); if (!c) setGstType("exclusive"); }} />
                    <Label htmlFor="gst" className="cursor-pointer">Apply GST</Label>
                  </div>
                  {gstEnabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label>GST Rate (%)</Label>
                        <Input type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="18" />
                      </div>
                      <div className="space-y-2">
                        <Label>GST Type</Label>
                        <RadioGroup value={gstType} onValueChange={(v: "exclusive" | "inclusive") => setGstType(v)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclusive" id="exclusive" disabled={gstType === "inclusive"} />
                            <Label htmlFor="exclusive" className={gstType === "inclusive" ? "text-muted-foreground line-through" : ""}>Exclusive (add GST on top)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="inclusive" id="inclusive" />
                            <Label htmlFor="inclusive">Inclusive (GST in price)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST ({gstRate}% {gstType})</span>
                        <span className="font-medium">₹{gstAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <span className="text-xl font-bold">₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button className="w-full" onClick={handleSaveBill} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Bill Changes"}
                </Button>
                <Button variant="outline" className="w-full bg-transparent" onClick={() => router.push("/bills")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
     </main>

      {/* Print after save dialog */}
      <Dialog open={printAfterSaveOpen} onOpenChange={setPrintAfterSaveOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-green-600" />
              Bill Saved Successfully!
            </DialogTitle>
            <DialogDescription>
              Bill <strong>{savedBillData?.billNumber}</strong> has been updated. Would you like to print the updated bill?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPrintAfterSaveOpen(false)}>
              No, go back
            </Button>
            <Button className="flex-1" onClick={handlePrintSavedBill}>
              <Printer className="h-4 w-4 mr-2" />
              Yes, Print Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}