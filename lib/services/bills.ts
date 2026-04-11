import { supabaseRequest } from "@/lib/supabase"
import type { BillItem } from "@/lib/types"

export async function checkBillNumberExists(billNumber: string) {
  const rows = await supabaseRequest<Array<{ id: number }>>(
    `bills?select=id&bill_number=eq.${encodeURIComponent(billNumber)}&limit=1`,
  )
  return { exists: (rows?.length ?? 0) > 0 }
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
  const bills = await supabaseRequest<Array<{ id: number }>>("bills?select=id", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      bill_number: billData.billNumber,
      customer_name: billData.customerName,
      phone_number: billData.customerPhone,
      subtotal: billData.subtotal,
      gst_amount: billData.gstAmount,
      gst_rate: billData.gstRate,
      gst_type: billData.gstType ?? "EXCLUSIVE",
      discount: billData.discountAmount,
      total_amount: billData.totalAmount,
    }),
  })

  const bill = bills?.[0]
  if (!bill) {
    throw new Error("Supabase returned empty bill insert response")
  }

  if (billData.items.length > 0) {
    const payloadWithStock = billData.items.map((item) => ({
      bill_id: bill.id,
      stock_id: item.stockId,
      design_name: item.designName,
      size: item.size,
      type: item.type,
      quantity_boxes: item.noOfBoxes,
      price_per_box: item.pricePerBox,
      total_price: item.totalAmount,
    }))

    try {
      await supabaseRequest<null>("bill_items", {
        method: "POST",
        body: JSON.stringify(payloadWithStock),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : ""
      const stockColumnMissing = message.includes("stock_id") && message.includes("column")

      if (!stockColumnMissing) throw error

      const payloadLegacy = billData.items.map((item) => ({
        bill_id: bill.id,
        design_name: item.designName,
        size: item.size,
        type: item.type,
        quantity_boxes: item.noOfBoxes,
        price_per_box: item.pricePerBox,
        total_price: item.totalAmount,
      }))

      await supabaseRequest<null>("bill_items", {
        method: "POST",
        body: JSON.stringify(payloadLegacy),
      })
    }
  }

  return bill
}
