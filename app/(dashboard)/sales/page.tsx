"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Trash2, Edit, Eye, AlertCircle, Printer, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { getStocks } from "@/lib/services/stocks"
import { createBill, checkBillNumberExists } from "@/lib/services/bills"
import { useCategory } from "@/context/CategoryContext"
import type { Stock, BillItem } from "@/lib/types"

type CartItem = {
  id: string
  stockId: number
  design_name: string
  size: string
  type: string
  boxes: number
  price: number
  total: number
}

export default function NewSalePage() {
  const router = useRouter()
  const { selectedCategory, selectedCategoryId } = useCategory()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [billNumber, setBillNumber] = useState("")
  const [billNumberError, setBillNumberError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [boxQuantity, setBoxQuantity] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstRate, setGstRate] = useState("18")
  const [gstType, setGstType] = useState<"EXCLUSIVE" | "INCLUSIVE">("EXCLUSIVE")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [viewBillOpen, setViewBillOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [viewOldBillOpen, setViewOldBillOpen] = useState(false)
  const [oldBillNumber, setOldBillNumber] = useState("")
  const [oldBillData, setOldBillData] = useState<any>(null)

  // Load stocks from Supabase - filtered by category
  useEffect(() => {
    const loadStocks = async () => {
      try {
        const data = await getStocks()
        // Filter by selected category
        const filteredData = data.filter((stock: Stock) => stock.categoryId === selectedCategoryId)
        setStocks(filteredData)
      } catch (error) {
        console.error("Failed to load stocks:", error)
        alert("Failed to load stocks from Supabase")
      } finally {
        setLoading(false)
      }
    }
    loadStocks()
  }, [selectedCategoryId])

  const handleBillNumberChange = async (value: string) => {
    setBillNumber(value)
    if (value) {
      try {
        const result = await checkBillNumberExists(value)
        if (result.exists) {
          setBillNumberError("This bill number is already used")
        } else {
          setBillNumberError("")
        }
      } catch (error) {
        console.error("Failed to check bill number:", error)
      }
    } else {
      setBillNumberError("")
    }
  }

  const filteredStocks = stocks.filter((stock) =>
    stock.designName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock)
    setSearchQuery(stock.designName)
    setCustomPrice(stock.price.toString())
  }

  const handleAddToCart = () => {
    if (!selectedStock || !boxQuantity || Number.parseInt(boxQuantity) <= 0) {
      alert("Please select a design and enter valid quantity")
      return
    }

    const boxes = Number.parseInt(boxQuantity)
    const price = customPrice ? Number.parseFloat(customPrice) : selectedStock.price

    if (boxes > selectedStock.noOfBoxes) {
      alert(`Only ${selectedStock.noOfBoxes} boxes available`)
      return
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      stockId: selectedStock.id,
      design_name: selectedStock.designName,
      size: selectedStock.size,
      type: selectedStock.type,
      boxes: boxes,
      price: price,
      total: boxes * price,
    }

    setCartItems([...cartItems, newItem])
    setSelectedStock(null)
    setBoxQuantity("")
    setCustomPrice("")
    setSearchQuery("")
  }

  const handleEditItem = (item: CartItem) => {
    setEditingItemId(item.id)
  }

  const handleUpdateItem = (itemId: string, field: "boxes" | "price", value: string) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === itemId) {
          const newBoxes = field === "boxes" ? Number.parseInt(value) || 0 : item.boxes
          const newPrice = field === "price" ? Number.parseFloat(value) || 0 : item.price
          return {
            ...item,
            boxes: newBoxes,
            price: newPrice,
            total: newBoxes * newPrice,
          }
        }
        return item
      }),
    )
  }

  const handleRemoveItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId))
    if (editingItemId === itemId) {
      setEditingItemId(null)
    }
  }

  const handleAdjustUnitPrices = () => {
    const rate = Number.parseFloat(gstRate)
    setCartItems(
      cartItems.map((item) => {
        const adjustedPrice = item.price / (1 + rate / 100)
        return {
          ...item,
          price: Number.parseFloat(adjustedPrice.toFixed(2)),
          total: item.boxes * Number.parseFloat(adjustedPrice.toFixed(2)),
        }
      }),
    )
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!billNumber.trim()) {
      errors.push("Bill number is required")
    }
    if (!customerName.trim()) {
      errors.push("Customer name is required")
    }
    if (!customerPhone.trim()) {
      errors.push("Phone number is required")
    } else if (!/^[+]?[\d\s-()]{10,}$/.test(customerPhone)) {
      errors.push("Please enter a valid phone number")
    }
    if (cartItems.length === 0) {
      errors.push("Add at least one item to cart")
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleViewOldBill = async () => {
    if (!oldBillNumber.trim()) {
      alert("Please enter a bill number")
      return
    }

    try {
      router.push(`/bills/edit/${oldBillNumber}`)
    } catch (error) {
      console.error("Failed to fetch bill:", error)
      alert("Bill not found")
    }
  }

  const handleCompleteSale = async () => {
    if (!validateForm()) return

    try {
      const billItems: BillItem[] = cartItems.map((item) => ({
        stockId: item.stockId,
        designName: item.design_name,
        size: item.size,
        type: item.type,
        noOfBoxes: item.boxes,
        pricePerBox: item.price,
        totalAmount: item.total,
      }))

      const billData = {
        billNumber,
        customerName,
        customerPhone,
        items: billItems,
        subtotal,
        gstRate: gstEnabled ? Number.parseFloat(gstRate) : 0,
        gstType: gstEnabled ? gstType : undefined,
        gstAmount,
        discountAmount: 0,
        totalAmount: grandTotal,
      }

      await createBill(billData)
      alert(`Sale completed! Bill: ${billNumber}`)
      // Reset form
      setBillNumber("")
      setCustomerName("")
      setCustomerPhone("")
      setCartItems([])
    } catch (error) {
      console.error("Failed to save bill:", error)
      alert("Failed to save bill. Please try again.")
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0)

  let gstAmount = 0
  let grandTotal = 0

  if (gstEnabled) {
    if (gstType === "EXCLUSIVE") {
      gstAmount = (subtotal * Number.parseFloat(gstRate)) / 100
      grandTotal = subtotal + gstAmount
    } else {
      grandTotal = subtotal
      gstAmount = (grandTotal * Number.parseFloat(gstRate)) / (100 + Number.parseFloat(gstRate))
    }
  } else {
    grandTotal = subtotal
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading stocks...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Create Sale" }]}
        title="Create Sale"
        description="Process new transactions and generate bills"
        action={
          <div className="flex items-center gap-2 min-w-[300px]">
            <Input
              placeholder="Enter bill number"
              value={oldBillNumber}
              onChange={(e) => setOldBillNumber(e.target.value)}
              className="h-9"
            />
            <Button onClick={handleViewOldBill} size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
        <div className="space-y-6">
          {/* Bill Information - Full Width at Top */}
          <Card className="mb-6 max-w-4xl mx-auto">
            <CardHeader className="pb-4">
              <CardTitle>Bill Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_number">Bill Number *</Label>
                  <Input
                    id="bill_number"
                    placeholder="INV-20250115-001"
                    value={billNumber}
                    onChange={(e) => handleBillNumberChange(e.target.value)}
                  />
                  {billNumberError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{billNumberError}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_phone">Phone Number *</Label>
                  <Input
                    id="customer_phone"
                    placeholder="+91 98765 43210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-6xl mx-auto">
            {/* Left Column - Add Items and Cart */}
            <div className="space-y-6">
              {/* Category Display */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-muted-foreground">Selling from Category:</p>
                <p className="font-semibold text-lg text-blue-700">{selectedCategory.toUpperCase()}</p>
              </div>

              {/* Add Items Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Items</CardTitle>
                  <CardDescription>Search and add items to cart</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search_design">Search Design Name</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search_design"
                        placeholder="Type design name..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {searchQuery && filteredStocks.length > 0 && (
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        {filteredStocks.map((stock) => (
                          <div
                            key={stock.id}
                            className="p-2.5 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleStockSelect(stock)}
                          >
                            <div className="font-medium text-sm">{stock.designName}</div>
                            <div className="text-xs text-muted-foreground">
                              {stock.size} • {stock.type} • {stock.noOfBoxes} boxes available
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedStock && (
                    <div className="p-3 bg-muted rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium">{selectedStock.size}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">{selectedStock.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available</p>
                          <p className="font-medium">{selectedStock.noOfBoxes} boxes</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="box_quantity" className="text-sm">
                            No. of Boxes
                          </Label>
                          <Input
                            id="box_quantity"
                            type="number"
                            placeholder="Qty"
                            value={boxQuantity}
                            onChange={(e) => setBoxQuantity(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="custom_price" className="text-sm">
                            Amount per Box (₹)
                          </Label>
                          <Input
                            id="custom_price"
                            type="number"
                            placeholder="Price"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <Button onClick={handleAddToCart} className="w-full" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shopping Cart Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Shopping Cart ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {cartItems.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No items in cart. Add items to continue.
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[35%]">Design</TableHead>
                            <TableHead className="w-[15%]">Size</TableHead>
                            <TableHead className="w-[15%] text-right">Boxes</TableHead>
                            <TableHead className="w-[15%] text-right">Price</TableHead>
                            <TableHead className="w-[15%] text-right">Total</TableHead>
                            <TableHead className="w-[5%]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-sm">{item.design_name}</TableCell>
                              <TableCell className="text-sm">{item.size}</TableCell>
                              <TableCell className="text-right text-sm">{item.boxes}</TableCell>
                              <TableCell className="text-right text-sm">₹{item.price}</TableCell>
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
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Bill Summary */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Bill Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gst_toggle" className="cursor-pointer text-sm">
                        Apply GST
                      </Label>
                      <Switch id="gst_toggle" checked={gstEnabled} onCheckedChange={setGstEnabled} />
                    </div>

                    {gstEnabled && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="gst_rate" className="text-xs">
                            GST Rate (%)
                          </Label>
                          <Input
                            id="gst_rate"
                            type="number"
                            value={gstRate}
                            onChange={(e) => setGstRate(e.target.value)}
                            className="h-8"
                          />
                        </div>

                        <RadioGroup value={gstType} onValueChange={(value) => setGstType(value as "EXCLUSIVE" | "INCLUSIVE")}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="EXCLUSIVE" id="exclusive" />
                            <Label htmlFor="exclusive" className="text-sm cursor-pointer">
                              Exclusive
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="INCLUSIVE" id="inclusive" />
                            <Label htmlFor="inclusive" className="text-sm cursor-pointer">
                              Inclusive
                            </Label>
                          </div>
                        </RadioGroup>

                        {gstType === "INCLUSIVE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAdjustUnitPrices}
                            className="w-full bg-transparent"
                          >
                            Adjust Unit Prices
                          </Button>
                        )}

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">GST ({gstRate}%)</span>
                          <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button onClick={() => setViewBillOpen(true)} variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Bill
                  </Button>
                  <Button onClick={handleCompleteSale} className="w-full">
                    Complete Sale
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* View Bill Dialog */}
      <Dialog open={viewBillOpen} onOpenChange={setViewBillOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Preview</DialogTitle>
            <DialogDescription>Review the bill before completing the sale</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Bill Number</p>
                <p className="font-medium">{billNumber || "Not entered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer Name</p>
                <p className="font-medium">{customerName || "Not entered"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone Number</p>
                <p className="font-medium">{customerPhone || "Not entered"}</p>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Boxes</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.design_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.size} • {item.type}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.boxes}</TableCell>
                      <TableCell className="text-right">₹{item.price}</TableCell>
                      <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {gstEnabled && (
                <>
                  <div className="flex justify-between">
                    <span>
                      GST ({gstRate}% {gstType}):
                    </span>
                    <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total:</span>
                <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setViewBillOpen(false)} variant="outline" className="flex-1">
                Edit
              </Button>
              <Button onClick={handleCompleteSale} className="flex-1">
                Confirm & Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Old Bill Dialog */}
      <Dialog open={oldBillData !== null} onOpenChange={() => setOldBillData(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {oldBillData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Bill Number</p>
                  <p className="font-mono font-medium">{oldBillData.billNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{oldBillData.createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{oldBillData.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{oldBillData.customerPhone}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Items</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Design Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Boxes</TableHead>
                        <TableHead className="text-right">Price/Box</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {oldBillData.items?.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.designName}</TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell className="text-right">{item.noOfBoxes}</TableCell>
                          <TableCell className="text-right">₹{item.pricePerBox}</TableCell>
                          <TableCell className="text-right font-medium">₹{item.totalAmount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{oldBillData.subtotal?.toLocaleString()}</span>
                </div>
                {oldBillData.gstRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      GST ({oldBillData.gstRate}% {oldBillData.gstType})
                    </span>
                    <span className="font-medium">₹{oldBillData.gstAmount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-lg font-bold">₹{oldBillData.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => alert("Edit functionality")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Bill
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => alert("Print functionality")}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bill
                </Button>
                <Button onClick={() => setOldBillData(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
