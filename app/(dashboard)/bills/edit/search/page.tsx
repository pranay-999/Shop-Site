"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Trash2, Edit, AlertCircle, Save, Search, FileText, User, Phone } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { API_BASE } from "@/lib/api"

interface CartItem {
  id: string
  design_name: string
  size: string
  type: string
  boxes: number
  pricePerBox: number
  total: number
}

interface BillSuggestion {
  billNumber: string
  customerName: string
  phoneNumber: string
}

export default function EditBillPage() {
  const router = useRouter()

  // ── Search form state ────────────────────────────────────────────────────
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [searchTab, setSearchTab] = useState<"billNumber" | "customerName" | "phone">("billNumber")
  const [searchBillNumber, setSearchBillNumber] = useState("")
  const [searchCustomerName, setSearchCustomerName] = useState("")
  const [searchPhone, setSearchPhone] = useState("")
  const [suggestions, setSuggestions] = useState<BillSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const suggestionRef = useRef<HTMLDivElement>(null)

  // ── Edit form state ──────────────────────────────────────────────────────
  const [billData, setBillData] = useState({ bill_number: "", customer_name: "", customer_phone: "" })
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editBoxes, setEditBoxes] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [gstType, setGstType] = useState<"exclusive" | "inclusive">("exclusive")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Live suggestions as user types — debounced 250ms
  useEffect(() => {
    const query =
      searchTab === "billNumber" ? searchBillNumber :
      searchTab === "customerName" ? searchCustomerName : searchPhone

    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true)
      try {
        const res = await fetch(`${API_BASE}/bills/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const bills: any[] = await res.json()
          const mapped = bills.slice(0, 6).map((b) => ({
            billNumber: b.billNumber,
            customerName: b.customerName,
            phoneNumber: b.phoneNumber,
          }))
          setSuggestions(mapped)
          setShowSuggestions(mapped.length > 0)
        }
      } catch {
        // suggestions are optional — ignore errors
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchBillNumber, searchCustomerName, searchPhone, searchTab])

  // Load a bill by its bill number
  const loadBill = async (billNumber: string) => {
    setSearchError("")
    setIsSearching(true)
    try {
      const res = await fetch(`${API_BASE}/bills/number/${encodeURIComponent(billNumber.trim())}`)
      if (!res.ok) {
        setSearchError(`Bill "${billNumber}" not found. Check and try again.`)
        return
      }
      const bill = await res.json()
      setBillData({
        bill_number: bill.billNumber,
        customer_name: bill.customerName,
        customer_phone: bill.phoneNumber,
      })
      setCartItems(
        (bill.items ?? []).map((item: any) => ({
          id: String(item.id),
          design_name: item.designName,
          size: item.size,
          type: item.type,
          boxes: item.quantityBoxes,
          pricePerBox: item.pricePerBox,
          total: item.totalPrice,
        }))
      )
      if (bill.gstRate && bill.gstRate > 0) {
        setGstEnabled(true)
        setGstRate(String(bill.gstRate))
        setGstType(bill.gstType === "INCLUSIVE" ? "inclusive" : "exclusive")
      }
      setShowSearchForm(false)
    } catch {
      setSearchError("Could not connect to server. Make sure the backend is running.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleSuggestionClick = (s: BillSuggestion) => {
    setShowSuggestions(false)
    loadBill(s.billNumber)
  }

  const handleSearchBill = async () => {
    const query =
      searchTab === "billNumber" ? searchBillNumber :
      searchTab === "customerName" ? searchCustomerName : searchPhone

    if (!query.trim()) {
      setSearchError("Please enter a value to search")
      return
    }

    if (searchTab === "billNumber") {
      await loadBill(query)
      return
    }

    // Name or phone — search and either auto-load (1 result) or show list (multiple)
    setIsSearching(true)
    setSearchError("")
    try {
      const res = await fetch(`${API_BASE}/bills/search?q=${encodeURIComponent(query.trim())}`)
      const bills: any[] = res.ok ? await res.json() : []
      if (bills.length === 0) {
        setSearchError("No bills found. Try a different search.")
      } else if (bills.length === 1) {
        await loadBill(bills[0].billNumber)
      } else {
        setSuggestions(bills.slice(0, 6).map((b) => ({
          billNumber: b.billNumber,
          customerName: b.customerName,
          phoneNumber: b.phoneNumber,
        })))
        setShowSuggestions(true)
        setSearchError(`${bills.length} bills found — select one below.`)
      }
    } catch {
      setSearchError("Could not connect to server.")
    } finally {
      setIsSearching(false)
    }
  }

  // Cart editing
  const handleEditItem = (item: CartItem) => {
    setEditingItemId(item.id)
    setEditBoxes(item.boxes.toString())
    setEditPrice(item.pricePerBox.toString())
  }

  const handleUpdateItem = (id: string) => {
    const boxes = Number.parseInt(editBoxes)
    const pricePerBox = Number.parseFloat(editPrice)
    if (!boxes || boxes <= 0 || !pricePerBox || pricePerBox <= 0) {
      alert("Please enter valid values")
      return
    }
    setCartItems(cartItems.map((item) =>
      item.id === id ? { ...item, boxes, pricePerBox, total: boxes * pricePerBox } : item
    ))
    setEditingItemId(null)
  }

  const handleRemoveItem = (id: string) => setCartItems(cartItems.filter((item) => item.id !== id))

  // Save
  const validateForm = () => {
    const errors: string[] = []
    if (!billData.customer_name.trim()) errors.push("Customer name is required")
    if (!billData.customer_phone.trim()) errors.push("Phone number is required")
    if (cartItems.length === 0) errors.push("At least one item is required")
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSaveBill = async () => {
    if (!validateForm()) return
    setIsSaving(true)
    setSaveSuccess("")
    try {
      const res = await fetch(`${API_BASE}/bills/${billData.bill_number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billNumber: billData.bill_number,
          customerName: billData.customer_name,
          phoneNumber: billData.customer_phone,
          subtotal,
          gstRate: gstEnabled ? Number.parseFloat(gstRate) : 0,
          gstType: gstEnabled ? gstType.toUpperCase() : "EXCLUSIVE",
          gstAmount,
          discount: 0,
          totalAmount: finalTotal,
          items: cartItems.map((item) => ({
            designName: item.design_name,
            size: item.size,
            type: item.type,
            quantityBoxes: item.boxes,
            pricePerBox: item.pricePerBox,
            totalPrice: item.total,
          })),
        }),
      })
      if (!res.ok) { alert("Failed to save. Please try again."); return }
      setSaveSuccess(`✅ Bill ${billData.bill_number} updated successfully!`)
      setValidationErrors([])
    } catch {
      alert("Could not connect to server.")
    } finally {
      setIsSaving(false)
    }
  }

  // Totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)
  let gstAmount = 0
  let finalTotal = subtotal
  if (gstEnabled && gstRate) {
    const rate = Number.parseFloat(gstRate) / 100
    if (gstType === "exclusive") { gstAmount = subtotal * rate; finalTotal = subtotal + gstAmount }
    else { gstAmount = (subtotal * rate) / (1 + rate); finalTotal = subtotal }
  }

  // ── SEARCH FORM ───────────────────────────────────────────────────────────
  if (showSearchForm) {
    const tabs = [
      { key: "billNumber" as const, label: "Bill Number", Icon: FileText, placeholder: "e.g. INV-20260412-001" },
      { key: "customerName" as const, label: "Customer Name", Icon: User, placeholder: "e.g. Rajesh Kumar" },
      { key: "phone" as const, label: "Phone Number", Icon: Phone, placeholder: "e.g. 9876543210" },
    ]
    const activeValue =
      searchTab === "billNumber" ? searchBillNumber :
      searchTab === "customerName" ? searchCustomerName : searchPhone
    const setActiveValue = (val: string) => {
      if (searchTab === "billNumber") setSearchBillNumber(val)
      else if (searchTab === "customerName") setSearchCustomerName(val)
      else setSearchPhone(val)
    }

    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader
          items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
          title="Edit Bill"
          description="Search for a bill to edit it"
        />
        <main className="container mx-auto px-4 py-10 max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Find Bill</CardTitle>
              <CardDescription>Search by bill number, customer name, or phone number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Tab switcher */}
              <div className="flex rounded-lg border overflow-hidden">
                {tabs.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setSearchTab(key); setSearchError(""); setShowSuggestions(false) }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
                      ${searchTab === key
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Input + suggestions */}
              <div ref={suggestionRef} className="space-y-1">
                <Label>{tabs.find((t) => t.key === searchTab)?.label}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9"
                    placeholder={tabs.find((t) => t.key === searchTab)?.placeholder}
                    value={activeValue}
                    onChange={(e) => { setActiveValue(e.target.value); setSearchError("") }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchBill()}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    autoFocus
                  />
                </div>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="border rounded-lg shadow-lg bg-background overflow-hidden z-10">
                    <div className="px-3 py-1.5 bg-muted/60 text-xs text-muted-foreground font-medium border-b">
                      {suggestions.length} result{suggestions.length > 1 ? "s" : ""} — click to open
                    </div>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        className="w-full px-3 py-2.5 hover:bg-muted text-left flex items-center justify-between border-b last:border-b-0 transition-colors"
                        onClick={() => handleSuggestionClick(s)}
                      >
                        <div>
                          <p className="font-medium text-sm font-mono text-primary">{s.billNumber}</p>
                          <p className="text-xs text-muted-foreground">{s.customerName}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.phoneNumber}</p>
                      </button>
                    ))}
                  </div>
                )}

                {isLoadingSuggestions && (
                  <p className="text-xs text-muted-foreground pl-1 animate-pulse">Searching...</p>
                )}
              </div>

              {searchError && (
                <Alert variant={searchError.includes("found —") ? "default" : "destructive"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button onClick={handleSearchBill} className="flex-1" disabled={isSearching || !activeValue.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? "Searching..." : "Search Bill"}
                </Button>
                <Button variant="outline" onClick={() => router.push("/bills")} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // ── EDIT FORM ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
        title="Edit Bill"
        description={`Editing: ${billData.bill_number}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowSearchForm(true); setSaveSuccess("") }}>
              ← Search Another
            </Button>
            <Button onClick={handleSaveBill} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">

        {/* Bill Info */}
        <Card className="mb-6 max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Bill Number</Label>
                <Input value={billData.bill_number} disabled className="bg-muted font-mono" />
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

          {/* Cart table */}
          <Card>
            <CardHeader>
              <CardTitle>Cart Items ({cartItems.length})</CardTitle>
              <CardDescription>Edit quantities or prices inline, or remove items</CardDescription>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No items in this bill.</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">Design</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Boxes</TableHead>
                        <TableHead className="text-right">Price/Box</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-[90px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.id}>
                          {editingItemId === item.id ? (
                            <>
                              <TableCell className="font-medium text-sm">{item.design_name}</TableCell>
                              <TableCell className="text-sm">{item.size}</TableCell>
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
                                <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleUpdateItem(item.id)}>Save</Button>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="font-medium text-sm">{item.design_name}</TableCell>
                              <TableCell className="text-sm">{item.size}</TableCell>
                              <TableCell className="text-right text-sm">{item.boxes}</TableCell>
                              <TableCell className="text-right text-sm">₹{item.pricePerBox}</TableCell>
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

          {/* Summary */}
          <Card className="h-fit">
            <CardHeader><CardTitle>Bill Summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {saveSuccess && (
                <div className="bg-green-50 border border-green-300 text-green-800 rounded-md p-3 text-sm font-medium">
                  {saveSuccess}
                </div>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
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
                  <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                </div>

                <div className="pt-3 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch id="gst" checked={gstEnabled} onCheckedChange={(v) => setGstEnabled(v as boolean)} />
                      <Label htmlFor="gst" className="cursor-pointer">Apply GST</Label>
                    </div>
                  </div>
                  {gstEnabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="gst_rate">GST Rate (%)</Label>
                        <Input id="gst_rate" type="number" value={gstRate} onChange={(e) => setGstRate(e.target.value)} placeholder="18" />
                      </div>
                      <RadioGroup value={gstType} onValueChange={(v: "exclusive" | "inclusive") => setGstType(v)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="exclusive" id="excl" />
                          <Label htmlFor="excl" className="cursor-pointer">Exclusive (add on top)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="inclusive" id="incl" />
                          <Label htmlFor="incl" className="cursor-pointer">Inclusive (included in price)</Label>
                        </div>
                      </RadioGroup>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST ({gstRate}%)</span>
                        <span className="font-medium">₹{gstAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-3 border-t">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="text-xl font-bold">₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Button className="w-full" onClick={handleSaveBill} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Bill Changes"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/bills")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}