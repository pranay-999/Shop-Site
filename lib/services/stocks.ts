import { apiFetch } from "@/lib/api"
import type { Stock } from "@/lib/types"

// Java API already returns camelCase matching our Stock type
// We just add the alias fields so existing page code doesn't break
function normalizeStock(s: Stock): Stock {
  return {
    ...s,
    price: s.pricePerBox,       // sales page uses stock.price
    noOfBoxes: s.totalBoxes,    // sales page uses stock.noOfBoxes
  }
}

export async function getStocks(): Promise<Stock[]> {
  const data = await apiFetch<Stock[]>("/stocks")
  return data.map(normalizeStock)
}

export async function searchStocks(query: string): Promise<Stock[]> {
  if (!query.trim()) return getStocks()
  const data = await apiFetch<Stock[]>(`/stocks/search?q=${encodeURIComponent(query)}`)
  return data.map(normalizeStock)
}

export async function createStock(stockData: {
  designName: string
  type: string
  size: string
  totalBoxes: number
  pricePerBox: number
  categoryId: number
}) {
  const result = await apiFetch<Stock>("/stocks", {
    method: "POST",
    body: JSON.stringify(stockData),
  })
  return normalizeStock(result)
}

export async function deleteStock(id: number) {
  return apiFetch<void>(`/stocks/${id}`, { method: "DELETE" })
}

export async function getLowStockItems(threshold = 10): Promise<Stock[]> {
  const data = await apiFetch<Stock[]>(`/stocks/low-stock?threshold=${threshold}`)
  return data.map(normalizeStock)
}

export async function uploadStockExcel(file: File, categoryId: number) {
  if (!file.name.endsWith(".csv")) {
    throw new Error("Only CSV upload is supported. Please use a .csv file.")
  }

  const text = await file.text()
  const rows = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  if (rows.length < 2) throw new Error("CSV file is empty or has no data rows.")

  const headers = rows[0].split(",").map((h) => h.trim().toLowerCase())

  // Support both 4-column (your template) and 5-column (with price) formats
  const required4 = ["design_name", "type", "size", "total_boxes"]
  const missing = required4.filter((k) => !headers.includes(k))
  if (missing.length > 0) throw new Error(`Missing required CSV columns: ${missing.join(", ")}`)

  const idx = (name: string) => headers.indexOf(name)

  const stocks = rows.slice(1).map((row) => {
    const cols = row.split(",").map((c) => c.trim())
    return {
      designName: cols[idx("design_name")],
      type: cols[idx("type")],
      size: cols[idx("size")],
      totalBoxes: Number(cols[idx("total_boxes")]),
      // price_per_box column is optional — default to 0 if not present
      pricePerBox: idx("price_per_box") >= 0 ? Number(cols[idx("price_per_box")]) : 0,
      categoryId,
    }
  })

  let inserted = 0
  const errors: string[] = []

  for (const stock of stocks) {
    try {
      await apiFetch<unknown>("/stocks", {
        method: "POST",
        body: JSON.stringify(stock),
      })
      inserted++
    } catch (err) {
      errors.push(`"${stock.designName}": ${err instanceof Error ? err.message : "failed"}`)
    }
  }

  if (errors.length > 0 && inserted === 0) {
    throw new Error(`All rows failed:\n${errors.join("\n")}`)
  }

  return { inserted, errors }
}