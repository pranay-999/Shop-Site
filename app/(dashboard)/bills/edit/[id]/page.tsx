"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
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

interface StockItem {
  id: string
  design_name: string
  size: string
  type: string
  remaining: number
  price: number
}

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
  const params = useParams()
  const router = useRouter()

  const [showSearchForm, setShowSearchForm] = useState(true)
  const [searchBillNumber, setSearchBillNumber] = useState("")
  const [searchCustomerName, setSearchCustomerName] = useState("")
  const [searchCustomerPhone, setSearchCustomerPhone] = useState("")
  const [searchError, setSearchError] = useState("")
  const [billFound, setBillFound] = useState(false)
  const [billData, setBillData] = useState({
    bill_number: "",
    customer_name: "",
    customer_phone: "",
    cart_items: [] as CartItem[],
  })

  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null)
  const [boxQuantity, setBoxQuantity] = useState("")
  const [customPrice, setCustomPrice] = useState("")
  const [gstEnabled, setGstEnabled] = useState(true)
  const [gstRate, setGstRate] = useState("18")
  const [gstType, setGstType] = useState<"exclusive" | "inclusive">("exclusive")
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("") // Declared setSearchQuery here

  const stocks: StockItem[] = [
    { id: "1", design_name: "Premium Marble Tile", size: "600x600mm", type: "Floor Tile", remaining: 55, price: 850 },
    { id: "2", design_name: "Designer Sanitary Ware", size: "Model A23", type: "Washbasin", remaining: 3, price: 1200 },
    { id: "3", design_name: "Classic Floor Tile", size: "300x300mm", type: "Floor Tile", remaining: 80, price: 450 },
    { id: "4", design_name: "Premium Glossy Tile", size: "800x800mm", type: "Wall Tile", remaining: 42, price: 1100 },
    { id: "5", design_name: "Modern Toilet Suite", size: "Model B45", type: "Toilet", remaining: 12, price: 2500 },
  ]

  const [cartItems, setCartItems] = useState<CartItem[]>(billData.cart_items)

  const filteredStocks = stocks.filter((stock) => stock.design_name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleStockSelect = (stock: StockItem) => {
    setSelectedStock(stock)
    setCustomPrice(stock.price.toString())
    setBoxQuantity("")
    setSearchQuery("") // Use setSearchQuery here
  }

  const handleAddToCart = () => {
    if (!selectedStock || !boxQuantity || Number.parseInt(boxQuantity) <= 0) {
      alert("Please select a stock item and enter valid quantity")
      return
    }

    const boxes = Number.parseInt(boxQuantity)
    const pricePerBox = Number.parseFloat(customPrice) || selectedStock.price

    if (boxes > selectedStock.remaining) {
      alert(`Only ${selectedStock.remaining} boxes available in stock`)
      return
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      design_name: selectedStock.design_name,
      size: selectedStock.size,
      type: selectedStock.type,
      boxes,
      pricePerBox,
      total: boxes * pricePerBox,
    }

    setCartItems([...cartItems, newItem])
    setSelectedStock(null)
    setBoxQuantity("")
    setCustomPrice("")
  }

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const handleEditItem = (item: CartItem) => {
    setEditingItemId(item.id)
    setBoxQuantity(item.boxes.toString())
    setCustomPrice(item.pricePerBox.toString())
  }

  const handleUpdateItem = (id: string) => {
    const boxes = Number.parseInt(boxQuantity)
    const pricePerBox = Number.parseFloat(customPrice)

    if (boxes <= 0 || pricePerBox <= 0) {
      alert("Please enter valid values")
      return
    }

    setCartItems(
      cartItems.map((item) => (item.id === id ? { ...item, boxes, pricePerBox, total: boxes * pricePerBox } : item)),
    )
    setEditingItemId(null)
    setBoxQuantity("")
    setCustomPrice("")
  }

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

  const validateForm = () => {
    const errors: string[] = []

    if (!billData.bill_number.trim()) errors.push("Bill number is required")
    if (!billData.customer_name.trim()) errors.push("Customer name is required")
    if (!billData.customer_phone.trim()) errors.push("Phone number is required")
    if (cartItems.length === 0) errors.push("Add at least one item to cart")

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSaveBill = () => {
    if (validateForm()) {
      alert("Bill updated successfully!")
      router.push("/bills")
    }
  }

  const handleSearchBill = () => {
    if (!searchBillNumber.trim() && !searchCustomerName.trim() && !searchCustomerPhone.trim()) {
      setSearchError("Please enter at least one search criteria (Bill Number, Customer Name, or Phone Number)")
      return
    }

    setSearchError("")
    // In real app, search database with these criteria
    // For now, just show the edit form
    setShowSearchForm(false)
    setBillFound(true)
    setBillData({
      bill_number: "INV-20250115-001",
      customer_name: "Rajesh Kumar",
      customer_phone: "+91 98765 43210",
      cart_items: [
        {
          id: "1",
          design_name: "Premium Marble Tile",
          size: "600x600mm",
          type: "Floor Tile",
          boxes: 5,
          pricePerBox: 850,
          total: 4250,
        },
        {
          id: "2",
          design_name: "Classic Floor Tile",
          size: "300x300mm",
          type: "Floor Tile",
          boxes: 3,
          pricePerBox: 450,
          total: 1350,
        },
      ],
    })
  }

  if (showSearchForm) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader
          items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
          title="Search Bill"
          description="Enter at least one search criteria to find the bill"
        />

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Find Bill to Edit</CardTitle>
              <CardDescription>
                Enter bill number, customer name, or phone number (at least one required)
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
                  placeholder="INV-20250115-001"
                  value={searchBillNumber}
                  onChange={(e) => setSearchBillNumber(e.target.value)}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">OR</div>

              <div className="space-y-2">
                <Label htmlFor="search_customer_name">Customer Name</Label>
                <Input
                  id="search_customer_name"
                  placeholder="Enter customer name"
                  value={searchCustomerName}
                  onChange={(e) => setSearchCustomerName(e.target.value)}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">OR</div>

              <div className="space-y-2">
                <Label htmlFor="search_customer_phone">Phone Number</Label>
                <Input
                  id="search_customer_phone"
                  placeholder="+91 98765 43210"
                  value={searchCustomerPhone}
                  onChange={(e) => setSearchCustomerPhone(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSearchBill} className="flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Search Bill
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

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader
        items={[{ label: "Bills & Invoices", href: "/bills" }, { label: "Edit Bill" }]}
        title="Edit Bill"
        description={`Bill Number: ${billData.bill_number}`}
        action={
          <Button onClick={handleSaveBill}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
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
                  value={billData.bill_number}
                  onChange={(e) => setBillData({ ...billData, bill_number: e.target.value })}
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
          <div className="space-y-6">
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
                          <div className="font-medium text-sm">{stock.design_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {stock.size} • {stock.type} • {stock.remaining} boxes available
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
                        <p className="font-medium">{selectedStock.remaining} boxes</p>
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bill Summary Section - Right Side */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <span className="text-muted-foreground">Items in Cart</span>
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
                      <Label htmlFor="gst" className="cursor-pointer">
                        Apply GST
                      </Label>
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
                        <span className="text-muted-foreground">
                          GST Amount ({gstRate}% {gstType})
                        </span>
                        <span className="font-medium">
                          ₹{gstAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
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
                <Button className="w-full" onClick={handleSaveBill}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Bill Changes
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
