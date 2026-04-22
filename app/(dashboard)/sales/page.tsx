"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Plus,
  Trash2,
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
  Receipt,
  Printer,
  CreditCard,
  ChevronRight,
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
import { cn } from "@/lib/utils";

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
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Get unique categories from stocks
  const categories = useMemo(() => {
    const types = [...new Set(stocks.map((s) => s.type))].filter(Boolean);
    return ["all", ...types];
  }, [stocks]);

  // Filter stocks by search and category
  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const matchesSearch = stock.designName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || stock.type === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stocks, searchQuery, activeCategory]);

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

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
    setAddToCartError("");
    const stockPrice = stock.pricePerBox ?? stock.price ?? 0;
    setCustomPrice(stockPrice > 0 ? stockPrice.toString() : "");
    setBoxQuantity("1");
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
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(cartItems.map((item) => {
      if (item.id !== itemId) return item;
      const newBoxes = Math.max(1, item.boxes + delta);
      return { ...item, boxes: newBoxes, total: newBoxes * item.price };
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    const removed = cartItems.find((i) => i.id === itemId);
    setCartItems(cartItems.filter((i) => i.id !== itemId));
    setBaseCartPrices((prev) => { const u = { ...prev }; delete u[itemId]; return u; });
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
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">
          {/* Header */}
          <header className="shrink-0 border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Point of Sale</h1>
                <p className="text-sm text-muted-foreground">{selectedCategory}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push("/bills")}>
                <FileText className="mr-2 h-4 w-4" />
                View Bills
              </Button>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background"
              />
            </div>

            {/* Category Tabs */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "All Products" : cat}
                </button>
              ))}
            </div>
          </header>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredStocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredStocks.map((stock) => {
                  const available = stock.noOfBoxes ?? stock.totalBoxes ?? 0;
                  const price = stock.pricePerBox ?? stock.price ?? 0;
                  const isSelected = selectedStock?.id === stock.id;
                  const isOutOfStock = available === 0;

                  return (
                    <button
                      key={stock.id}
                      disabled={isOutOfStock}
                      onClick={() => handleStockSelect(stock)}
                      className={cn(
                        "relative p-4 rounded-xl border text-left transition-all",
                        isOutOfStock
                          ? "bg-secondary/30 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
                          : "bg-card hover:border-primary/50 hover:shadow-sm"
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground text-sm line-clamp-1">{stock.designName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stock.size}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          isOutOfStock 
                            ? "bg-destructive/10 text-destructive"
                            : available <= 5 
                            ? "bg-warning/10 text-warning"
                            : "bg-accent/10 text-accent"
                        )}>
                          {isOutOfStock ? "Out of stock" : `${available} left`}
                        </span>
                        {price > 0 && (
                          <span className="text-sm font-semibold text-foreground">₹{price}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Product Quick Add */}
          {selectedStock && (
            <div className="shrink-0 border-t bg-card p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedStock.designName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedStock.size} | {selectedStock.type} | {selectedStock.noOfBoxes ?? selectedStock.totalBoxes} available
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={boxQuantity}
                      onChange={(e) => setBoxQuantity(e.target.value)}
                      className="w-20 h-10 text-center"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="w-24 h-10"
                    />
                  </div>
                  <Button onClick={handleAddToCart} className="h-10">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setSelectedStock(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {addToCartError && (
                <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {addToCartError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className="w-full max-w-md flex flex-col bg-card">
          {/* Success Message */}
          {saleSuccessMessage && (
            <div className="shrink-0 m-4 mb-0 flex items-center gap-3 rounded-lg bg-accent/10 border border-accent/20 p-3">
              <Check className="h-5 w-5 text-accent shrink-0" />
              <p className="text-sm font-medium text-foreground">{saleSuccessMessage}</p>
            </div>
          )}

          {/* Customer Info */}
          <div className="shrink-0 p-4 border-b">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Customer Details
            </h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Bill #"
                  value={billNumber}
                  onChange={(e) => handleBillNumberChange(e.target.value)}
                  className="pl-8 h-9 text-sm font-mono"
                />
              </div>
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            {billNumberError && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {billNumberError}
              </p>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground">Cart is empty</p>
                <p className="text-sm text-muted-foreground mt-1">Select products to add them here</p>
              </div>
            ) : (
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-1">{item.design_name}</p>
                        <p className="text-xs text-muted-foreground">{item.size} | {item.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">₹{item.price} per box</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-1.5 hover:bg-secondary transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.boxes}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-1.5 hover:bg-secondary transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="font-semibold text-foreground">₹{item.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary & Checkout */}
          <div className="shrink-0 border-t bg-secondary/20 p-4">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-0.5">
                    {validationErrors.map((error, index) => <li key={index}>{error}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* GST Toggle */}
            <div className="flex items-center justify-between mb-3">
              <Label htmlFor="gst" className="text-sm text-muted-foreground cursor-pointer">Apply GST</Label>
              <Switch id="gst" checked={gstEnabled} onCheckedChange={(val) => { setGstEnabled(val); if (!val) setGstType("EXCLUSIVE"); }} />
            </div>

            {gstEnabled && (
              <div className="flex items-center gap-3 mb-3">
                <Input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-20 h-8 text-sm"
                  placeholder="%"
                />
                <RadioGroup value={gstType} onValueChange={(v) => setGstType(v as "EXCLUSIVE" | "INCLUSIVE")} className="flex gap-3">
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="EXCLUSIVE" id="ex" />
                    <Label htmlFor="ex" className="text-xs cursor-pointer">Exclusive</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RadioGroupItem value="INCLUSIVE" id="in" />
                    <Label htmlFor="in" className="text-xs cursor-pointer">Inclusive</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Price Summary */}
            <div className="space-y-1.5 py-3 border-y border-border/50 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items ({cartItems.length})</span>
                <span className="text-foreground">{totalBoxes} boxes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {gstEnabled && gstAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({gstRate}%)</span>
                  <span className="text-foreground">₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewBillOpen(true)}
                disabled={cartItems.length === 0}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={handleCompleteSale}
                disabled={cartItems.length === 0}
                className="flex-[2]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Sale
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview Dialog */}
      <Dialog open={viewBillOpen} onOpenChange={setViewBillOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice Preview
            </DialogTitle>
            <DialogDescription>Review invoice before completing the sale</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Bill To</p>
                <p className="font-semibold text-foreground mt-1">{customerName || "Customer Name"}</p>
                <p className="text-sm text-muted-foreground">{customerPhone || "Phone Number"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Invoice</p>
                <p className="font-mono font-semibold text-foreground mt-1">{billNumber}</p>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN")}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-center p-3 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{item.design_name}</p>
                        <p className="text-xs text-muted-foreground">{item.size}</p>
                      </td>
                      <td className="text-center p-3 text-muted-foreground">{item.boxes}</td>
                      <td className="text-right p-3 font-medium text-foreground">₹{item.total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({gstRate}%)</span>
                  <span className="text-foreground">₹{gstAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button onClick={handleCompleteSale} className="w-full">
              <Check className="mr-2 h-4 w-4" />
              Confirm & Complete Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={printAfterSaleOpen} onOpenChange={setPrintAfterSaleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-accent" />
              Sale Completed
            </DialogTitle>
            <DialogDescription>Would you like to print the invoice?</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => saveBillAndReset(false)} className="flex-1">
              Skip
            </Button>
            <Button onClick={() => saveBillAndReset(true)} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppSidebar>
  );
}
