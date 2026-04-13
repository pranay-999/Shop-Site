import { apiFetch } from "@/lib/api"

export async function checkBillNumberExists(billNumber: string) {
  return apiFetch<{ exists: boolean }>("/bills/check-bill-number", {
    method: "POST",
    body: JSON.stringify({ billNumber }),
  })
}

// Takes cart items exactly as sales/page.tsx builds them and maps to Java field names
export async function createBill(billData: {
  billNumber: string
  customerName: string
  customerPhone: string
  items: {
    stockId: number
    design_name: string  // sales page uses design_name
    size: string
    type: string
    boxes: number        // sales page uses boxes
    price: number        // sales page uses price
    total: number        // sales page uses total
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
        stockId:       item.stockId,       // ← sends stockId so backend can deduct stock
        designName:    item.design_name,   // design_name → designName
        size:          item.size,
        type:          item.type,
        quantityBoxes: item.boxes,         // boxes → quantityBoxes
        pricePerBox:   item.price,         // price → pricePerBox
        totalPrice:    item.total,         // total → totalPrice
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