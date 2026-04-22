"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  AlertCircle,
  Search,
  ShoppingCart,
  Package,
  User,
  Phone,
  Hash,
  X,
  Check,
  Minus,
  FileText,
  ArrowRight,
  Sparkles,
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
          <div style="font-family:system-ui,-apple-system,sans-serif; padding:40px; max-width:600px; margin:0 auto;">
            <div style="border-bottom:2px solid #0f172a; padding-bottom:20px; margin-bottom:24px;">
              <h1 style="margin:0; font-size:28px; font-weight:700; color:#0f172a;">INVOICE</h1>
              <p style="margin:8px 0 0; color:#64748b; font-size:14px;">Bill No: <span style="color:#0f172a; font-weight:600;">${bill.billNumber}</span></p>
              <p style="margin:4px 0 0; color:#64748b; font-size:14px;">Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
            </div>
            <div style="background:#f8fafc; border-radius:12px; padding:20px; margin-bottom:24px;">
              <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Bill To</p>
              <p style="margin:8px 0 0; font-size:18px; font-weight:600; color:#0f172a;">${bill.customerName}</p>
              <p style="margin:4px 0 0; color:#64748b;">${bill.customerPhone}</p>
            </div>
            <table width="100%" style="border-collapse:collapse; margin-bottom:24px;">
              <thead>
                <tr style="border-bottom:2px solid #e2e8f0;">
                  <th style="text-align:left; padding:12px 0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Item</th>
                  <th style="text-align:center; padding:12px 0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Qty</th>
                  <th style="text-align:right; padding:12px 0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Rate</th>
                  <th style="text-align:right; padding:12px 0; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; color:#64748b;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map((item) => `
                  <tr style="border-bottom:1px solid #e2e8f0;">
                    <td style="padding:16px 0;">
                      <p style="margin:0; font-weight:500; color:#0f172a;">${item.design_name}</p>
                      <p style="margin:4px 0 0; font-size:13px; color:#64748b;">${item.size} | ${item.type}</p>
                    </td>
                    <td style="text-align:center; padding:16px 0; color:#0f172a;">${item.boxes}</td>
                    <td style="text-align:right; padding:16px 0; color:#0f172a;">₹${item.price}</td>
                    <td style="text-align:right; padding:16px 0; font-weight:600; color:#0f172a;">₹${item.total.toLocaleString("en-IN")}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div style="border-top:2px solid #e2e8f0; padding-top:16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#64748b;">Subtotal</span>
                <span style="color:#0f172a;">₹${bill.subtotal.toLocaleString("en-IN")}</span>
              </div>
              ${bill.gstAmount > 0 ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                  <span style="color:#64748b;">GST (${bill.gstRate}%)</span>
                  <span style="color:#0f172a;">₹${bill.gstAmount.toLocaleString("en-IN")}</span>
                </div>` : ""}
              <div style="display:flex; justify-content:space-between; margin-top:16px; padding-top:16px; border-top:2px solid #0f172a;">
                <span style="font-size:18px; font-weight:700; color:#0f172a;">Total</span>
                <span style="font-size:24px; font-weight:700; color:#0f172a;">₹${bill.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>`;
        win.document.write(`<html><head><title>Invoice ${bill.billNumber}</title><style>@media print{@page{margin:0.5in;}}</style></head><body style="margin:0;padding:0;">${html}</body></html>`);
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

  const totalBoxes = cartItems.reduce((sum, item) => sum + item.boxes, 0);

  if (loading) {
    return (
      <AppSidebar>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-secondary" />
              <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">Loading inventory...</p>
          </div>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <div className="min-h-screen bg-background">
        {/* Clean Header */}
        <header className="border-b bg-card">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">New Sale</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Create invoice for <span className="text-primary font-medium">{selectedCategory}</span>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/bills")} className="hidden sm:flex">
                <FileText className="mr-2 h-4 w-4" />
                View Bills
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {/* Success Message */}
            {saleSuccessMessage && (
              <div className="mb-6 flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                  <Check className="h-4 w-4 text-accent-foreground" />
                </div>
                <p className="font-medium text-foreground">{saleSuccessMessage}</p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              {/* Left Column - Forms */}
              <div className="lg:col-span-3 space-y-6">
                {/* Customer & Bill Info */}
                <div className="rounded-xl border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-semibold text-foreground">Customer Details</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bill_number" className="text-sm text-muted-foreground">
                        Bill Number
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          id="bill_number"
                          placeholder="INV-001"
                          value={billNumber}
                          onChange={(e) => handleBillNumberChange(e.target.value)}
                          className="pl-9 font-mono"
                        />
                      </div>
                      {billNumberError && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {billNumberError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_name" className="text-sm text-muted-foreground">
                        Customer Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          id="customer_name"
                          placeholder="John Doe"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_phone" className="text-sm text-muted-foreground">
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          id="customer_phone"
                          placeholder="+91 98765 43210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Search */}
                <div className="rounded-xl border bg-card p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="font-semibold text-foreground">Add Products</h2>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products by design name..."
                      className="pl-10 h-11"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Search Results */}
                  {searchQuery && filteredStocks.length > 0 && (
                    <div className="mt-3 rounded-lg border bg-background max-h-56 overflow-y-auto">
                      {filteredStocks.map((stock, index) => (
                        <button
                          key={stock.id}
                          className={`w-full flex items-center justify-between p-3 text-left hover:bg-secondary/50 transition-colors ${index !== 0 ? "border-t" : ""}`}
                          onClick={() => handleStockSelect(stock)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{stock.designName}</p>
                              <p className="text-xs text-muted-foreground">{stock.size} | {stock.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              {stock.noOfBoxes ?? stock.totalBoxes} <span className="text-muted-foreground font-normal">boxes</span>
                            </p>
                            {(stock.pricePerBox ?? stock.price ?? 0) > 0 && (
                              <p className="text-xs text-muted-foreground">₹{stock.pricePerBox ?? stock.price}/box</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery && filteredStocks.length === 0 && (
                    <div className="mt-3 rounded-lg border border-dashed bg-secondary/20 p-8 text-center">
                      <Package className="mx-auto h-10 w-10 text-muted-foreground/30" />
                      <p className="mt-3 text-sm font-medium text-muted-foreground">No products found</p>
                      <p className="text-xs text-muted-foreground/70">Try a different search term</p>
                    </div>
                  )}

                  {/* Selected Product Card */}
                  {selectedStock && (
                    <div className="mt-4 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Sparkles className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{selectedStock.designName}</p>
                            <p className="text-sm text-muted-foreground">
                              {selectedStock.size} | {selectedStock.type} | <span className="text-primary font-medium">{selectedStock.noOfBoxes ?? selectedStock.totalBoxes} available</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedStock(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Quantity (Boxes)</Label>
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            value={boxQuantity}
                            onChange={(e) => setBoxQuantity(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Price per Box (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Enter price"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="h-10"
                          />
                        </div>
                      </div>
                      {addToCartError && (
                        <p className="mt-3 text-sm text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" />
                          {addToCartError}
                        </p>
                      )}
                      <Button onClick={handleAddToCart} className="w-full mt-4 h-10">
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="border-b bg-secondary/30 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <h2 className="font-semibold text-foreground">Cart</h2>
                    </div>
                    {cartItems.length > 0 && (
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                        {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                      </span>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="p-10 text-center">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="mt-4 font-medium text-foreground">Your cart is empty</p>
                      <p className="mt-1 text-sm text-muted-foreground">Search and add products to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {cartItems.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-secondary/20 transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-foreground">{item.design_name}</p>
                                  <p className="text-xs text-muted-foreground">{item.size} | {item.type}</p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                              {editingItemId === item.id ? (
                                <div className="mt-3 flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground">Qty:</Label>
                                    <Input
                                      type="number"
                                      value={item.boxes}
                                      onChange={(e) => handleUpdateItem(item.id, "boxes", e.target.value)}
                                      className="w-20 h-8"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground">Price:</Label>
                                    <Input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => handleUpdateItem(item.id, "price", e.target.value)}
                                      className="w-24 h-8"
                                    />
                                  </div>
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingItemId(null)}>
                                    Done
                                  </Button>
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-muted-foreground">
                                      {item.boxes} {item.boxes === 1 ? "box" : "boxes"} × ₹{item.price}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-foreground">₹{item.total.toLocaleString("en-IN")}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Summary */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border bg-card overflow-hidden lg:sticky lg:top-6">
                  <div className="border-b bg-secondary/30 px-5 py-4">
                    <h2 className="font-semibold text-foreground">Order Summary</h2>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside text-sm space-y-0.5">
                            {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Items</p>
                        <p className="text-lg font-semibold text-foreground">{cartItems.length}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/50 p-3">
                        <p className="text-xs text-muted-foreground">Total Boxes</p>
                        <p className="text-lg font-semibold text-foreground">{totalBoxes}</p>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 py-3 border-y">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {gstEnabled && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">GST ({gstRate}%)</span>
                          <span className="font-medium text-foreground">₹{gstAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>

                    {/* GST Toggle */}
                    <div className="rounded-lg bg-secondary/30 p-4 space-y-3">
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
                        <div className="space-y-3 pt-3 border-t">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">GST Rate (%)</Label>
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
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="EXCLUSIVE" id="exclusive" />
                              <Label htmlFor="exclusive" className="text-sm cursor-pointer">Exclusive</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="INCLUSIVE" id="inclusive" />
                              <Label htmlFor="inclusive" className="text-sm cursor-pointer">Inclusive</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="rounded-lg bg-primary p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary-foreground">Grand Total</span>
                        <span className="text-2xl font-bold text-primary-foreground">₹{grandTotal.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => setViewBillOpen(true)}
                        variant="outline"
                        className="w-full h-10"
                        disabled={cartItems.length === 0}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Invoice
                      </Button>
                      <Button
                        onClick={handleCompleteSale}
                        className="w-full h-11"
                        disabled={cartItems.length === 0}
                      >
                        Complete Sale
                        <ArrowRight className="ml-2 h-4 w-4" />
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Invoice Preview</DialogTitle>
              <DialogDescription>Review before completing the sale</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              {/* Customer Info */}
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Bill Number</p>
                    <p className="font-semibold font-mono mt-1">{billNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                    <p className="font-semibold mt-1">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Customer</p>
                    <p className="font-semibold mt-1">{customerName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Phone</p>
                    <p className="font-semibold mt-1">{customerPhone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Rate</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {cartItems.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-medium">{item.design_name}</p>
                          <p className="text-xs text-muted-foreground">{item.size} | {item.type}</p>
                        </td>
                        <td className="p-3 text-center">{item.boxes}</td>
                        <td className="p-3 text-right">₹{baseCartPrices[item.id] ?? item.price}</td>
                        <td className="p-3 text-right font-semibold">₹{item.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {gstEnabled && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">GST ({gstRate}% {gstType})</span>
                    <span className="font-medium">₹{gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-t-2 border-foreground/10">
                  <span className="text-lg font-bold">Grand Total</span>
                  <span className="text-xl font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setViewBillOpen(false)} variant="outline" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={handleCompleteSale} className="flex-1">
                  <Check className="mr-2 h-4 w-4" />
                  Confirm Sale
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        <Dialog open={printAfterSaleOpen} onOpenChange={(open) => { if (!open) { setPrintAfterSaleOpen(false); setCompletedBillData(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Check className="h-4 w-4 text-accent-foreground" />
                </div>
                Sale Complete
              </DialogTitle>
              <DialogDescription>
                Bill <span className="font-semibold font-mono">{completedBillData?.billNumber}</span> has been saved successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg bg-secondary/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount Collected</p>
                <p className="text-3xl font-bold text-foreground mt-1">₹{completedBillData?.grandTotal.toLocaleString("en-IN")}</p>
                <p className="text-sm text-muted-foreground mt-2">from {completedBillData?.customerName}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => saveBillAndReset(true)} className="w-full">
                Print Invoice
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button onClick={() => saveBillAndReset(false)} variant="outline" className="w-full">
                Skip Printing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}
