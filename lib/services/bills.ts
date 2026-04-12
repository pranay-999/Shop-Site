import { apiFetch } from "@/lib/api"
import type { BillItem } from "@/lib/types"

export async function checkBillNumberExists(billNumber: string) {
  return apiFetch<{ exists: boolean }>("/bills/check-bill-number", {
    method: "POST",
    body: JSON.stringify({ billNumber }),
  })
}

export async function createBill(billData: {
  billNumber: string
  customerName: string
  customerPhone: string
  items: BillItem[]
  subtotal: number
  gstRate: number
  gstType?: "INCLUSIVE" | "EXCLUSIVE"
  gstAmount: number
  discountAmount: number
  totalAmount: number
}) {
  // Map field names to match what the Java backend expects
  return apiFetch("/bills", {
    method: "POST",
    body: JSON.stringify({
      billNumber: billData.billNumber,
      customerName: billData.customerName,
      phoneNumber: billData.customerPhone,
      subtotal: billData.subtotal,
      gstRate: billData.gstRate,
      gstType: billData.gstType ?? "EXCLUSIVE",
      gstAmount: billData.gstAmount,
      discount: billData.discountAmount,
      totalAmount: billData.totalAmount,
      items: billData.items.map(item => ({
        designName: item.designName,
        size: item.size,
        type: item.type,
        quantityBoxes: item.noOfBoxes,
        pricePerBox: item.pricePerBox,
        totalPrice: item.totalAmount,
      })),
    }),
  })
}

export async function getAllBills() {
  return apiFetch("/bills")
}

export async function searchBills(query: string) {
  return apiFetch(`/bills/search?q=${encodeURIComponent(query)}`)
}