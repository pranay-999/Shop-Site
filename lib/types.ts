export type Stock = {
  id: number
  designName: string
  size: string
  type: string
  totalBoxes: number
  pricePerBox: number
  categoryId: number
  createdAt: string
  updatedAt: string
  // Keep these as aliases so old code doesn't break
  noOfBoxes?: number
  price?: number
}

export type BillItem = {
  stockId: number
  designName: string
  size: string
  type: string
  noOfBoxes: number
  pricePerBox: number
  totalAmount: number
}

export type Bill = {
  id: number
  billNumber: string
  customerName: string
  customerPhone: string
  items: BillItem[]
  subtotal: number
  gstRate: number
  gstType: "INCLUSIVE" | "EXCLUSIVE"
  gstAmount: number
  discountAmount: number
  totalAmount: number
}

export type ProductCategory = {
  id: number
  categoryName: string
  categorySlug: string
  description: string
  icon: string
  colorCode: string
  isActive: boolean
}