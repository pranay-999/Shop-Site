// Backward-compatible API module.
// Keeps older imports working while the app now uses Supabase service modules.

export {
  getStocks,
  searchStocks,
  createStock,
  deleteStock,
  uploadStockExcel,
} from "@/lib/services/stocks"

export {
  createBill,
  checkBillNumberExists,
} from "@/lib/services/bills"
