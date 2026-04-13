"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2, Edit, AlertCircle, Save, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationHeader } from "@/components/layout/navigation-header"

interface CartItem {
  id: string
  design_name: string
  size: string
  type: string
  boxes: number
  pricePerBox: number
  total: number
}

export default function EditBillPage() {
  const router = useRouter()

  // Controls whether we show the search form or the edit form
  const [showSearchForm, setShowSearchForm] = useState(true)

  // Search form fields
  const [searchBillNumber, setSearchBillNumber] = useState("")
  const [searchError, setSearchError] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // The bill data loaded from the API
  const [billData, setBillData] = useState({
    bill_number: "",
    customer_name: "",
    customer_phone: "",
  })

  // Cart items for the bill
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Item editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editBoxes, setEditBoxes] = useState("")
  const [editPrice, setEditPrice] = useState("")

  // GST state
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [gstType, setGstType] = useState<"exclusive" | "inclusive">("exclusive")

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  // ─── STEP 1: Search for bill by bill number ───────────────────────────────
  // This function calls the real API. "async" means it can use "await" inside.
  const handleSearchBill = async () => {
    if (!searchBillNumber.trim()) {
      setSearchError("Please enter a bill number to search")
      return
    }

    setSearchError("")
    setIsSearching(true)

    try {
      // Call the Java backend: GET /api/bills/number/INV-20260412-001
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"}/bills/number/${searchBillNumber.trim()}`
      )

      if (!res.ok) {
        setSearchError(`Bill "${searchBillNumber}" not found. Please check the bill number.`)
        return
      }

      const bill = await res.json()

      // Fill in the bill data from the real API response
      setBillData({
        bill_number:   bill.billNumber,
        customer_name: bill.customerName,
        customer_phone: bill.phoneNumber,
      })

      // Fill in the cart items from the real API response
      // bill.items comes from Java as: { id, designName, size, type, quantityBoxes, pricePerBox, totalPrice }
      // We map them to the CartItem shape this page uses
      setCartItems(
        (bill.items ?? []).map((item: any) => ({
          id:          String(item.id),
          design_name: item.designName,
          size:        item.size,
          type:        item.type,
          boxes:       item.quantityBoxes,
          pricePerBox: item.pricePerBox,
          total:       item.totalPrice,
        }))
      )

      // Also set GST from the bill if it was saved with GST
      if (bill.gstRate && bill.gstRate > 0) {
        setGstEnabled(true)
        setGstRate(String(bill.gstRate))
        setGstType(bill.gstType === "INCLUSIVE" ? "inclusive" : "exclusive")
      }

      // Switch from search form to edit form
      setShowSearchForm(false)

    } catch (e) {
      setSearchError("Could not connect to server. Make sure the backend is running.")
    } finally {
      setIsSearching(false)
    }
  }

  // ─── STEP 2: Cart item editing ────────────────────────────────────────────
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

    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, boxes, pricePerBox, total: boxes * pricePerBox }
          : item
      )
    )
    setEditingItemId(null)
    setEditBoxes("")
    setEditPrice("")
  }

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  // ─── STEP 3: Save the updated bill ───────────────────────────────────────
  const validateForm = () => {
    const errors: string[] = []
    if (!billData.customer_name.trim()) errors.push("Customer name is required")
    if (!billData.customer_phone.trim()) errors.push("Phone number is required")
    if (cartItems.length === 0) errors.push("Add at least one item to cart")
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSaveBill = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    setSaveSuccess("")

    try {
      // Call the Java backend: PUT /api/bills/INV-20260412-001
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"}/bills/${billData.bill_number}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billNumber:   billData.bill_number,
            customerName: billData.customer_name,
            phoneNumber:  billData.customer_phone,
            subtotal:     subtotal,
            gstRate:      gstEnabled ? Number.parseFloat(gstRate) : 0,
            gstType:      gstEnabled ? gstType.toUpperCase() : "EXCLUSIVE",
            gstAmount:    gstAmount,
            discount:     0,
            totalAmount:  finalTotal,
            items: cartItems.map(item => ({
              designName:    item.design_name,
              size:          item.size,
              type:          item.type,
              quantityBoxes: item.boxes,
              pricePerBox:   item.pricePerBox,
              totalPrice:    item.total,
            })),
          }),
        }
      )

      if (!res.ok) {
        alert("Failed to save bill. Please try again.")
        return
      }

      setSaveSuccess(`✅ Bill ${billData.bill_number} updated successfully!`)
      setValidationErrors([])

    } catch (e) {
      alert("Could not connect to server. Make sure the backend is running.")
    } finally {
      setIsSaving(false)
    }
  }

  // ─── Totals calculation ──────────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)

  let gstAmount = 0
  let finalTotal = subtotal

  if (gstEnabled && gstRate) {
    const rate = Number.parseFloat(gstRate) / 100
    if (gstType === "exclusive") {
      gstAmount = subtotal * rate
      finalTotal = subtotal + gstAmount
    } else {
      gstAmount = (subtotal * rate) / (1 + rate)
      finalTotal = subtotal
    }
  }

  // ─── SEARCH FORM (shown first) ────────────────────────────────────────────
  if (showSearchForm) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader
          items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
          title="Search Bill"
          description="Enter the bill number to find and edit it"
        />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Find Bill to Edit</CardTitle>
              <CardDescription>
                Enter the bill number (e.g. INV-20260412-001)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="search_bill_number">Bill Number</Label>
                <Input
                  id="search_bill_number"
                  placeholder="INV-20260412-001"
                  value={searchBillNumber}
                  onChange={(e) => setSearchBillNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearchBill() }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSearchBill} className="flex-1" disabled={isSearching}>
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

  // ─── EDIT FORM (shown after bill is found) ────────────────────────────────
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

        {/* Bill Information */}
        <Card className="mb-6 max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle>Bill Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_number">Bill Number</Label>
                <Input
                  id="bill_number"
                  value={billData.bill_number}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={billData.customer_name}
                  onChange={(e) => setBillData({ ...billData, customer_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_phone">Phone Number *</Label>
                <Input
                  id="customer_phone"
                  value={billData.customer_phone}
                  onChange={(e) => setBillData({ ...billData, customer_phone: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-6xl mx-auto">
          {/* Left column — cart */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                <CardDescription>Edit quantities or prices, or remove items</CardDescription>
              </CardHeader>
              <CardContent>
                {cartItems.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No items in this bill.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[35%]">Design</TableHead>
                          <TableHead className="w-[15%]">Size</TableHead>
                          <TableHead className="w-[12%] text-right">Boxes</TableHead>
                          <TableHead className="w-[15%] text-right">Price/Box</TableHead>
                          <TableHead className="w-[15%] text-right">Total</TableHead>
                          <TableHead className="w-[8%]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cartItems.map((item) => (
                          <TableRow key={item.id}>
                            {editingItemId === item.id ? (
                              // Inline edit row
                              <>
                                <TableCell className="font-medium text-sm">{item.design_name}</TableCell>
                                <TableCell className="text-sm">{item.size}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={editBoxes}
                                    onChange={(e) => setEditBoxes(e.target.value)}
                                    className="w-16 h-7 text-right text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-20 h-7 text-right text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-right text-sm font-medium">
                                  ₹{(Number(editBoxes || 0) * Number(editPrice || 0)).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleUpdateItem(item.id)}
                                  >
                                    Save
                                  </Button>
                                </TableCell>
                              </>
                            ) : (
                              // Normal display row
                              <>
                                <TableCell className="font-medium text-sm">{item.design_name}</TableCell>
                                <TableCell className="text-sm">{item.size}</TableCell>
                                <TableCell className="text-right text-sm">{item.boxes}</TableCell>
                                <TableCell className="text-right text-sm">₹{item.pricePerBox}</TableCell>
                                <TableCell className="text-right font-medium text-sm">
                                  ₹{item.total.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleRemoveItem(item.id)}
                                    >
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

          {/* Right column — Bill Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
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
                    <div className="font-medium mb-1">Please fix the following:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
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
                      <Switch
                        id="gst"
                        checked={gstEnabled}
                        onCheckedChange={(checked) => setGstEnabled(checked as boolean)}
                      />
                      <Label htmlFor="gst" className="cursor-pointer">Apply GST</Label>
                    </div>
                  </div>

                  {gstEnabled && (
                    <div className="space-y-3 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="gst_rate">GST Rate (%)</Label>
                        <Input
                          id="gst_rate"
                          type="number"
                          value={gstRate}
                          onChange={(e) => setGstRate(e.target.value)}
                          placeholder="18"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>GST Type</Label>
                        <RadioGroup
                          value={gstType}
                          onValueChange={(value: "exclusive" | "inclusive") => setGstType(value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="exclusive" id="exclusive" />
                            <Label htmlFor="exclusive">Exclusive (Add GST on top)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="inclusive" id="inclusive" />
                            <Label htmlFor="inclusive">Inclusive (GST included in total)</Label>
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
                  <span className="text-xl font-bold">
                    ₹{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
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
    </div>
  )
}