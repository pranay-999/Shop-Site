import { apiFetch } from "@/lib/api"
import type { Bill } from "@/lib/types"

export async function checkBillNumberExists(billNumber: string) {
  return apiFetch<{ exists: boolean }>("/bills/check-bill-number", {
    method: "POST",
    body: JSON.stringify({ billNumber }),
  })
}

// Fetch all bills from the backend (used by Manage Invoices page)
export async function getAllBills(): Promise<Bill[]> {
  return apiFetch<Bill[]>("/bills")
}

// Search bills by bill number, customer name, etc.
export async function searchBills(query: string): Promise<Bill[]> {
  return apiFetch<Bill[]>(`/bills/search?q=${encodeURIComponent(query)}`)
}

// Fetch a single bill by its bill number (used by Edit Bill page)
export async function getBillByNumber(billNumber: string): Promise<Bill> {
  return apiFetch<Bill>(`/bills/number/${encodeURIComponent(billNumber)}`)
}

// Delete a bill by bill number — backend restores stock automatically
export async function deleteBill(billNumber: string): Promise<void> {
  return apiFetch<void>(`/bills/${encodeURIComponent(billNumber)}`, {
    method: "DELETE",
  })
}

// Takes cart items from sales/page.tsx and maps to Java field names.
// IMPORTANT: originalPrice is the price BEFORE any GST adjustment.
// When inclusive GST is on, item.price gets divided but we always store
// the original price in the DB so the Inventory page shows the real price.
export async function createBill(billData: {
  billNumber: string
  customerName: string
  customerPhone: string
  items: {
    stockId: number
    design_name: string
    size: string
    type: string
    boxes: number
    price: number          // may be GST-adjusted (divided) price
    originalPrice?: number // the real price before GST adjustment — use this for DB
    total: number
  }[]
  subtotal: number
  gstRate: number
  gstType?: "INCLUSIVE" | "EXCLUSIVE"
  gstAmount: number
  discountAmount: number
  totalAmount: number
}) {
  return apiFetch("/bills", {
    method: "POST",
    body: JSON.stringify({
      billNumber:   billData.billNumber,
      customerName: billData.customerName,
      phoneNumber:  billData.customerPhone,
      subtotal:     billData.subtotal,
      gstRate:      billData.gstRate,
      gstType:      billData.gstType ?? "EXCLUSIVE",
      gstAmount:    billData.gstAmount,
      discount:     billData.discountAmount,
      totalAmount:  billData.totalAmount,
      items: billData.items.map(item => ({
        stockId:       item.stockId,
        designName:    item.design_name,
        size:          item.size,
        type:          item.type,
        quantityBoxes: item.boxes,
        // Always save the ORIGINAL price (before GST adjustment) to the DB
        pricePerBox:   item.originalPrice ?? item.price,
        totalPrice:    item.total,
      })),
    }),
  })
}