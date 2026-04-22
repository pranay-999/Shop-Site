"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  Search,
  Printer,
  ShoppingCart,
  Package,
  Receipt,
  User,
  Phone,
  Hash,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getStocks } from "@/lib/services/stocks";
import { createBill, checkBillNumberExists } from "@/lib/services/bills";
import { useCategory } from "@/context/CategoryContext";
import { API_BASE } from "@/lib/api";
import type { Stock } from "@/lib/types";

type CartItem = {
  id: string;
  stockId: number;
  design_name: string;
  size: string;
  type: string;
  boxes: number;
  price: number;
  total: number;
};

export default function NewSalePage() {
  const router = useRouter();
  const { selectedCategory, selectedCategoryId } = useCategory();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [billNumber, setBillNumber] = useState("");
  const [billNumberError, setBillNumberError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [boxQuantity, setBoxQuantity] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState("18");
  const [gstType, setGstType] = useState<"EXCLUSIVE" | "INCLUSIVE">("EXCLUSIVE");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewBillOpen, setViewBillOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [baseCartPrices, setBaseCartPrices] = useState<Record<string, number>>({});
  const [saleSuccessMessage, setSaleSuccessMessage] = useState("");
  const [printAfterSaleOpen, setPrintAfterSaleOpen] = useState(false);
  const [completedBillData, setCompletedBillData] = useState<{
    billNumber: string; customerName: string; customerPhone: string;
    items: typeof cartItems; subtotal: number; gstRate: number;
    gstType: string | undefined; gstAmount: number; grandTotal: number;
  } | null>(null);
  const [addToCartError, setAddToCartError] = useState("");

  useEffect(() => {
    async function loadNextBillNumber() {
      try {
        const res = await fetch(`${API_BASE}/bills/next-bill-number`);
        const data = await res.json();
        setBillNumber(data.billNumber);
        localStorage.setItem("lastBillNumber", data.billNumber);
      } catch (err) {
        console.error("Could not load bill number", err);
        const saved = localStorage.getItem("lastBillNumber");
        if (saved) setBillNumber(saved);
      }
    }
    loadNextBillNumber();
  }, []);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const data = await getStocks();
        setStocks(data.filter((s: Stock) => s.categoryId === selectedCategoryId));
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    loadStocks();
  }, [selectedCategoryId]);

  const handleBillNumberChange = async (value: string) => {
    setBillNumber(value);
    setSaleSuccessMessage("");
    if (value) {
      try {
        const result = await checkBillNumberExists(value);
        setBillNumberError(result.exists ? "This bill number is already used" : "");
      } catch {
        // ignore
      }
    } else {
      setBillNumberError("");
    }
  };

  const filteredStocks = stocks.filter((stock) =>
    stock.designName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setSearchQuery("");
    setAddToCartError("");
    const stockPrice = stock.pricePerBox ?? stock.price ?? 0;
    setCustomPrice(stockPrice > 0 ? stockPrice.toString() : "");
  };

  const handleAddToCart = () => {
    setAddToCartError("");
    if (!selectedStock) { setAddToCartError("Please select a design first"); return; }
    if (!boxQuantity || Number.parseInt(boxQuantity) <= 0) { setAddToCartError("Please enter a valid quantity"); return; }
    if (!customPrice || Number.parseFloat(customPrice) <= 0) { setAddToCartError("Please enter a price per box"); return; }

    const boxes = Number.parseInt(boxQuantity);
    const price = Number.parseFloat(customPrice);
    const availableBoxes = selectedStock.noOfBoxes ?? selectedStock.totalBoxes ?? 0;

    if (boxes > availableBoxes) { setAddToCartError(`Only ${availableBoxes} boxes available`); return; }

    const itemId = Date.now().toString();
    setBaseCartPrices((prev) => ({ ...prev, [itemId]: price }));

    const rate = Number.parseFloat(gstRate) || 0;
    const displayPrice = (gstEnabled && gstType === "INCLUSIVE" && rate > 0)
      ? Math.round((price / (1 + rate / 100)) * 100) / 100
      : price;

    setCartItems([...cartItems, {
      id: itemId,
      stockId: selectedStock.id,
      design_name: selectedStock.designName,
      size: selectedStock.size,
      type: selectedStock.type,
      boxes,
      price: displayPrice,
      total: Math.round(boxes * displayPrice * 100) / 100,
    }]);

    setStocks((prev) => prev.map((s) =>
      s.id === selectedStock.id
        ? { ...s, noOfBoxes: (s.noOfBoxes ?? s.totalBoxes ?? 0) - boxes, totalBoxes: (s.totalBoxes ?? 0) - boxes }
        : s
    ));

    setSelectedStock(null);
    setBoxQuantity("");
    setCustomPrice("");
    setSearchQuery("");
  };

  const handleEditItem = (item: CartItem) => setEditingItemId(item.id);

  const handleUpdateItem = (itemId: string, field: "boxes" | "price", value: string) => {
    setCartItems(cartItems.map((item) => {
      if (item.id !== itemId) return item;
      const newBoxes = field === "boxes" ? Number.parseInt(value) || 0 : item.boxes;
      const newPrice = field === "price" ? Number.parseFloat(value) || 0 : item.price;
      if (field === "price") {
        setBaseCartPrices((prev) => ({ ...prev, [itemId]: newPrice }));
      }
      return { ...item, boxes: newBoxes, price: newPrice, total: newBoxes * newPrice };
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    const removed = cartItems.find((i) => i.id === itemId);
    setCartItems(cartItems.filter((i) => i.id !== itemId));
    setBaseCartPrices((prev) => { const u = { ...prev }; delete u[itemId]; return u; });
    if (editingItemId === itemId) setEditingItemId(null);
    if (removed) {
      setStocks((prev) => prev.map((s) =>
        s.id === removed.stockId
          ? { ...s, noOfBoxes: (s.noOfBoxes ?? s.totalBoxes ?? 0) + removed.boxes, totalBoxes: (s.totalBoxes ?? 0) + removed.boxes }
          : s
      ));
    }
  };

  useEffect(() => {
    if (cartItems.length === 0) return;
    const rate = Number.parseFloat(gstRate) || 0;
    setCartItems((prev) => prev.map((item) => {
      const originalPrice = baseCartPrices[item.id] ?? item.price;
      const newPrice = Math.round(
        (gstEnabled && gstType === "INCLUSIVE" ? originalPrice / (1 + rate / 100) : originalPrice) * 100
      ) / 100;
      return { ...item, price: newPrice, total: Math.round(item.boxes * newPrice * 100) / 100 };
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstEnabled, gstType, gstRate]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!billNumber.trim()) errors.push("Bill number is required");
    if (!customerName.trim()) errors.push("Customer name is required");
    if (!customerPhone.trim()) errors.push("Phone number is required");
    else if (!/^[+]?[\d\s-()]{10,}$/.test(customerPhone)) errors.push("Please enter a valid phone number");
    if (cartItems.length === 0) errors.push("Add at least one item to cart");
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCompleteSale = async () => {
    if (!validateForm()) return;
    try {
      await createBill({
        billNumber,
        customerName,
        customerPhone,
        items: cartItems.map((item) => ({
          ...item,
          originalPrice: baseCartPrices[item.id] ?? item.price,
        })),
        subtotal,
        gstRate: gstEnabled ? Number.parseFloat(gstRate) : 0,
        gstType: gstEnabled ? gstType : undefined,
        gstAmount,
        discountAmount: 0,
        totalAmount: grandTotal,
      });

      setCompletedBillData({
        billNumber,
        customerName,
        customerPhone,
        items: cartItems,
        subtotal,
        gstRate: gstEnabled ? Number.parseFloat(gstRate) : 0,
        gstType: gstEnabled ? gstType : undefined,
        gstAmount,
        grandTotal,
      });

      setSaleSuccessMessage(`Bill ${billNumber} saved successfully!`);
      const computeNext = (current: string): string | null => {
        const match = current.match(/^(.*?)(\d+)$/);
        if (!match) return null;
        const prefix = match[1];
        const digits = match[2];
        const next = parseInt(digits, 10) + 1;
        const nextNum = next > 999 ? 1 : next;
        return prefix + String(nextNum).padStart(digits.length, "0");
      };
      const localNext = computeNext(billNumber);
      if (localNext) {
        setBillNumber(localNext);
        localStorage.setItem("lastBillNumber", localNext);
      } else {
        try {
          const res = await fetch(`${API_BASE}/bills/next-bill-number`);
          const data = await res.json();
          setBillNumber(data.billNumber);
          localStorage.setItem("lastBillNumber", data.billNumber);
        } catch { /* keep current if fetch fails */ }
      }
      setCustomerName("");
      setCustomerPhone("");
      setCartItems([]);
      setBaseCartPrices({});
      setGstEnabled(false);
      setViewBillOpen(false);
      setPrintAfterSaleOpen(true);
    } catch {
      setValidationErrors(["Failed to save bill. Please check your connection and try again."]);
    }
  };

  const saveBillAndReset = async (shouldPrint: boolean) => {
    if (shouldPrint && completedBillData) {
      const bill = completedBillData;
      const win = window.open("", "_blank");
      if (win) {
        const html = `
          <div style="font-family:Arial,sans-serif; padding:32px; max-width:620px; margin:0 auto; border:1px solid #e0e0e0;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111; padding-bottom:12px; margin-bottom:16px;">
              <div>
                <h2 style="margin:0; font-size:22px;">INVOICE</h2>
                <p style="margin:4px 0 0; color:#555; font-size:13px;">Bill No: <strong>${bill.billNumber}</strong></p>
              </div>
              <div style="text-align:right; font-size:13px; color:#555;">
                <p style="margin:0;">Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              </div>
            </div>
            <div style="margin-bottom:16px; font-size:14px;">
              <p style="margin:0;"><strong>Customer:</strong> ${bill.customerName}</p>
              <p style="margin:4px 0 0;"><strong>Phone:</strong> ${bill.customerPhone}</p>
            </div>
            <table width="100%" border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse; font-size:13px; margin-bottom:16px;">
              <thead style="background:#f5f5f5;">
                <tr>
                  <th style="text-align:left;">Design</th><th style="text-align:right;">Boxes</th>
                  <th style="text-align:right;">Price/Box</th><th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map((item) => `
                  <tr>
                    <td>${item.design_name} (${item.size} • ${item.type})</td>
                    <td style="text-align:right;">${item.boxes}</td>
                    <td style="text-align:right;">₹${item.price}</td>
                    <td style="text-align:right;">₹${item.total.toLocaleString("en-IN")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div style="text-align:right; font-size:14px;">
              <p style="margin:4px 0;">Subtotal: ₹${bill.subtotal.toLocaleString("en-IN")}</p>
              ${bill.gstAmount > 0 ? `<p style="margin:4px 0;">GST (${bill.gstRate}%): ₹${bill.gstAmount.toLocaleString("en-IN")}</p>` : ""}
              <p style="margin:8px 0 0; font-size:17px; font-weight:bold; border-top:1px solid #111; padding-top:8px;">
                Total: ₹${bill.grandTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>`;
        win.document.write(`<html><head><title>Invoice ${bill.billNumber}</title><style>@media print{body{margin:0;}}</style></head><body style="background:#fff; padding:24px;">${html}</body></html>`);
        win.document.close();
        setTimeout(() => win.print(), 300);
      }
    }
    setPrintAfterSaleOpen(false);
    setCompletedBillData(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  let gstAmount = 0;
  let grandTotal = subtotal;
  if (gstEnabled) {
    const rate = Number.parseFloat(gstRate) || 0;
    if (gstType === "EXCLUSIVE") {
      gstAmount = (subtotal * rate) / 100;
      grandTotal = subtotal + gstAmount;
    } else {
      grandTotal = cartItems.reduce((sum, item) => {
        const originalPrice = baseCartPrices[item.id] ?? item.price;
        return sum + Math.round(originalPrice * item.boxes * 100) / 100;
      }, 0);
      gstAmount = Math.round((grandTotal * rate) / (100 + rate) * 100) / 100;
    }
  }

  if (loading) {
    return (
      <AppSidebar>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <Receipt className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">Create Sale</h1>
                  <p className="text-sm text-muted-foreground">
                    Selling from <span className="font-medium text-primary">{selectedCategory}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push("/bills")}>
                  View All Bills
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            {/* Success Message */}
            {saleSuccessMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Check className="h-4 w-4 text-accent-foreground" />
                </div>
                <p className="font-medium text-accent">{saleSuccessMessage}</p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left Column - Customer & Products */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Information Card */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="border-b bg-secondary/30 px-5 py-4">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Customer Information
                    </h2>
                  </div>
                  <div className="p-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="bill_number" className="text-sm flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          Bill Number
                        </Label>
                        <Input
                          id="bill_number"
                          placeholder="INV-001"
                          value={billNumber}
                          onChange={(e) => handleBillNumberChange(e.target.value)}
                          className="font-mono"
                        />
                        {billNumberError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {billNumberError}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_name" className="text-sm flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          Customer Name
                        </Label>
                        <Input
                          id="customer_name"
                          placeholder="Enter name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer_phone" className="text-sm flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                          Phone Number
                        </Label>
                        <Input
                          id="customer_phone"
                          placeholder="+91 98765 43210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Search Card */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="border-b bg-secondary/30 px-5 py-4">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Add Products
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by design name..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Search Results */}
                    {searchQuery && filteredStocks.length > 0 && (
                      <div className="rounded-xl border bg-background max-h-48 overflow-y-auto divide-y">
                        {filteredStocks.map((stock) => (
                          <button
                            key={stock.id}
                            className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors"
                            onClick={() => handleStockSelect(stock)}
                          >
                            <div>
                              <p className="font-medium text-sm text-foreground">{stock.designName}</p>
                              <p className="text-xs text-muted-foreground">
                                {stock.size} • {stock.type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-foreground">
                                {stock.noOfBoxes ?? stock.totalBoxes} boxes
                              </p>
                              {(stock.pricePerBox ?? stock.price ?? 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  ₹{stock.pricePerBox ?? stock.price}/box
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery && filteredStocks.length === 0 && (
                      <div className="rounded-xl border border-dashed bg-secondary/20 p-6 text-center">
                        <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">No products found</p>
                      </div>
                    )}

                    {/* Selected Product */}
                    {selectedStock && (
                      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-foreground">{selectedStock.designName}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedStock.size} • {selectedStock.type} • {selectedStock.noOfBoxes ?? selectedStock.totalBoxes} available
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 -mt-2"
                            onClick={() => setSelectedStock(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Quantity (Boxes)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={boxQuantity}
                              onChange={(e) => setBoxQuantity(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Price per Box (₹)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                            />
                          </div>
                        </div>
                        {addToCartError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {addToCartError}
                          </p>
                        )}
                        <Button onClick={handleAddToCart} className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                  <div className="border-b bg-secondary/30 px-5 py-4 flex items-center justify-between">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      Cart
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {cartItems.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                        <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="mt-4 font-medium text-foreground">Cart is empty</p>
                      <p className="mt-1 text-sm text-muted-foreground">Search and add products above</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[45%]">Product</TableHead>
                            <TableHead className="text-center">Qty</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cartItems.map((item) => (
                            <TableRow key={item.id} className="group">
                              <TableCell>
                                <p className="font-medium text-sm">{item.design_name}</p>
                                <p className="text-xs text-muted-foreground">{item.size} • {item.type}</p>
                              </TableCell>
                              <TableCell className="text-center font-medium">{item.boxes}</TableCell>
                              <TableCell className="text-right">
                                <span className="font-medium">₹{item.price}</span>
                                {gstEnabled && gstType === "INCLUSIVE" && baseCartPrices[item.id] && (
                                  <p className="text-xs text-muted-foreground">incl. ₹{baseCartPrices[item.id]}</p>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">₹{item.total.toLocaleString("en-IN")}</TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Bill Summary */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border bg-card overflow-hidden sticky top-24">
                  <div className="border-b bg-secondary/30 px-5 py-4">
                    <h2 className="font-semibold text-foreground">Bill Summary</h2>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Summary Details */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">{cartItems.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* GST Settings */}
                    <div className="rounded-xl border bg-secondary/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="gst_toggle" className="text-sm font-medium cursor-pointer">
                          Apply GST
                        </Label>
                        <Switch
                          id="gst_toggle"
                          checked={gstEnabled}
                          onCheckedChange={(val) => { setGstEnabled(val); if (!val) setGstType("EXCLUSIVE"); }}
                        />
                      </div>

                      {gstEnabled && (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="space-y-1.5">
                            <Label className="text-xs">GST Rate (%)</Label>
                            <Input
                              type="number"
                              value={gstRate}
                              onChange={(e) => setGstRate(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <RadioGroup
                            value={gstType}
                            onValueChange={(v) => setGstType(v as "EXCLUSIVE" | "INCLUSIVE")}
                            className="space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="EXCLUSIVE" id="exclusive" />
                              <Label htmlFor="exclusive" className="text-sm cursor-pointer">
                                Exclusive (add on top)
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="INCLUSIVE" id="inclusive" />
                              <Label htmlFor="inclusive" className="text-sm cursor-pointer">
                                Inclusive (GST in price)
                              </Label>
                            </div>
                          </RadioGroup>
                          <div className="flex justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground">GST ({gstRate}%)</span>
                            <span className="font-medium">₹{gstAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="text-2xl font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <Button
                        onClick={() => setViewBillOpen(true)}
                        variant="outline"
                        className="w-full"
                        disabled={cartItems.length === 0}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Bill
                      </Button>
                      <Button
                        onClick={handleCompleteSale}
                        className="w-full"
                        disabled={cartItems.length === 0}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Complete Sale
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Bill Preview Dialog */}
        <Dialog open={viewBillOpen} onOpenChange={setViewBillOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bill Preview</DialogTitle>
              <DialogDescription>Review the bill before completing the sale</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill Number</p>
                  <p className="font-medium font-mono">{billNumber || "Not entered"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date().toLocaleDateString("en-IN")}</p>
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Boxes</TableHead>
                      <TableHead className="text-right">Price/Box</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.design_name}</p>
                          <p className="text-xs text-muted-foreground">{item.size} • {item.type}</p>
                        </TableCell>
                        <TableCell className="text-center">{item.boxes}</TableCell>
                        <TableCell className="text-right">₹{baseCartPrices[item.id] ?? item.price}</TableCell>
                        <TableCell className="text-right font-medium">₹{item.total.toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between">
                    <span>GST ({gstRate}% {gstType}):</span>
                    <span className="font-medium">₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Grand Total:</span>
                  <span className="text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
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

        {/* Print Dialog */}
        <Dialog open={printAfterSaleOpen} onOpenChange={(open) => { if (!open) { setPrintAfterSaleOpen(false); setCompletedBillData(null); } }}>
          <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-accent" />
                Sale Complete — Bill {completedBillData?.billNumber}
              </DialogTitle>
              <DialogDescription>Would you like to print this invoice?</DialogDescription>
            </DialogHeader>

            {completedBillData && (
              <div className="border rounded-lg p-4 text-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <h3 className="text-lg font-bold">INVOICE</h3>
                    <p className="text-xs text-muted-foreground">Bill No: <strong>{completedBillData.billNumber}</strong></p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <div>
                  <p><strong>Customer:</strong> {completedBillData.customerName}</p>
                  <p><strong>Phone:</strong> {completedBillData.customerPhone}</p>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="border p-2 text-left">Design</th>
                      <th className="border p-2 text-right">Boxes</th>
                      <th className="border p-2 text-right">Price/Box</th>
                      <th className="border p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedBillData.items.map((item, i) => (
                      <tr key={i}>
                        <td className="border p-2">{item.design_name} ({item.size})</td>
                        <td className="border p-2 text-right">{item.boxes}</td>
                        <td className="border p-2 text-right">₹{item.price}</td>
                        <td className="border p-2 text-right">₹{item.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right space-y-1">
                  <p>Subtotal: ₹{completedBillData.subtotal.toLocaleString("en-IN")}</p>
                  {completedBillData.gstAmount > 0 && (
                    <p>GST ({completedBillData.gstRate}%): ₹{completedBillData.gstAmount.toLocaleString("en-IN")}</p>
                  )}
                  <p className="font-bold text-base border-t pt-2">Total: ₹{completedBillData.grandTotal.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => saveBillAndReset(false)}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => saveBillAndReset(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print Bill
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}
