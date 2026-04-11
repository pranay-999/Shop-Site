import { requireSupabase } from "@/lib/supabase"
import type { BillItem } from "@/lib/types"

export async function checkBillNumberExists(billNumber: string) {
  const { count, error } = await requireSupabase()
    .from("bills")
    .select("id", { count: "exact", head: true })
    .eq("bill_number", billNumber)

  if (error) throw error
  return { exists: (count ?? 0) > 0 }
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
  const { data: bill, error: billError } = await requireSupabase()
    .from("bills")
    .insert({
      bill_number: billData.billNumber,
      customer_name: billData.customerName,
      phone_number: billData.customerPhone,
      subtotal: billData.subtotal,
      gst_amount: billData.gstAmount,
      gst_rate: billData.gstRate,
      gst_type: billData.gstType ?? "EXCLUSIVE",
      discount: billData.discountAmount,
      total_amount: billData.totalAmount,
    })
    .select("id")
    .single()

  if (billError) throw billError

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

    const insertWithStock = await requireSupabase().from("bill_items").insert(payloadWithStock)

    if (insertWithStock.error) {
      const message = insertWithStock.error.message.toLowerCase()
      const stockColumnMissing = message.includes("stock_id") && message.includes("column")

      if (!stockColumnMissing) {
        throw insertWithStock.error
      }

      const payloadLegacy = billData.items.map((item) => ({
        bill_id: bill.id,
        design_name: item.designName,
        size: item.size,
        type: item.type,
        quantity_boxes: item.noOfBoxes,
        price_per_box: item.pricePerBox,
        total_price: item.totalAmount,
      }))

      const legacyInsert = await requireSupabase().from("bill_items").insert(payloadLegacy)
      if (legacyInsert.error) throw legacyInsert.error
    }
  }

  return bill
}
