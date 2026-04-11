import { requireSupabase } from "@/lib/supabase"
import type { Stock } from "@/lib/types"

type StockRow = {
  id: number
  design_name: string
  size: string
  type: string
  total_boxes: number
  price_per_box: number
  category_id: number
  created_at: string
  updated_at: string
}

const mapStock = (row: StockRow): Stock => ({
  id: row.id,
  designName: row.design_name,
  size: row.size,
  type: row.type,
  noOfBoxes: row.total_boxes,
  price: row.price_per_box,
  categoryId: row.category_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getStocks(): Promise<Stock[]> {
  const { data, error } = await requireSupabase()
    .from("stocks")
    .select("id, design_name, size, type, total_boxes, price_per_box, category_id, created_at, updated_at")
    .order("id", { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapStock)
}

export async function searchStocks(query: string): Promise<Stock[]> {
  if (!query.trim()) return getStocks()

  const { data, error } = await requireSupabase()
    .from("stocks")
    .select("id, design_name, size, type, total_boxes, price_per_box, category_id, created_at, updated_at")
    .or(`design_name.ilike.%${query}%,size.ilike.%${query}%,type.ilike.%${query}%`)
    .order("id", { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapStock)
}

export async function createStock(stockData: {
  designName: string
  type: string
  size: string
  totalBoxes: number
  pricePerBox: number
  categoryId: number
}) {
  const { data, error } = await requireSupabase()
    .from("stocks")
    .insert({
      design_name: stockData.designName,
      type: stockData.type,
      size: stockData.size,
      total_boxes: stockData.totalBoxes,
      price_per_box: stockData.pricePerBox,
      category_id: stockData.categoryId,
    })
    .select("id, design_name, size, type, total_boxes, price_per_box, category_id, created_at, updated_at")
    .single()

  if (error) {
    const errorMessage = error.message.toLowerCase()
    if (errorMessage.includes("foreign key") && errorMessage.includes("category_id")) {
      throw new Error("Invalid category: make sure product_categories has this id and FK is configured correctly.")
    }
    throw error
  }
  return mapStock(data as StockRow)
}

export async function deleteStock(id: number) {
  const { error } = await requireSupabase().from("stocks").delete().eq("id", id)
  if (error) throw error
}

export async function uploadStockExcel(file: File, categoryId: number) {
  if (!file.name.endsWith(".csv")) {
    throw new Error("Only CSV upload is supported in Supabase mode. Please use .csv template.")
  }

  const text = await file.text()
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (rows.length < 2) {
    throw new Error("CSV file is empty or invalid")
  }

  const headers = rows[0].split(",").map((h) => h.trim().toLowerCase())
  const expected = ["design_name", "type", "size", "total_boxes", "price_per_box"]
  const missing = expected.filter((key) => !headers.includes(key))
  if (missing.length > 0) {
    throw new Error(`Missing required CSV columns: ${missing.join(", ")}`)
  }

  const index = (name: string) => headers.indexOf(name)

  const inserts = rows.slice(1).map((row) => {
    const cols = row.split(",").map((c) => c.trim())
    return {
      design_name: cols[index("design_name")],
      type: cols[index("type")],
      size: cols[index("size")],
      total_boxes: Number(cols[index("total_boxes")]),
      price_per_box: Number(cols[index("price_per_box")]),
      category_id: categoryId,
    }
  })

  const { error } = await requireSupabase().from("stocks").insert(inserts)
  if (error) throw error

  return { inserted: inserts.length }
}
