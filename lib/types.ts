export type Stock = {
  id: number
  designName: string
  size: string
  type: string
  initialBoxes: number   // how many boxes were added when stock was first created
  soldBoxes: number      // how many have been sold so far
  totalBoxes: number     // remaining boxes (initialBoxes - soldBoxes)
  pricePerBox: number
  categoryId: number
  createdAt: string
  updatedAt: string
  // Keep these as aliases so old sales page code doesn't break
  noOfBoxes?: number
  price?: number
}

export type BillItem = {
  id: number
  stockId: number
  designName: string
  size: string
  type: string
  quantityBoxes: number
  pricePerBox: number
  totalPrice: number
}

// A snapshot of a bill at a point in time (used for edit history)
export type BillSnapshot = {
  snapshotAt: string          // when this version was saved
  customerName: string
  phoneNumber: string
  subtotal: number
  gstRate: number
  gstType: "INCLUSIVE" | "EXCLUSIVE"
  gstAmount: number
  discount: number
  totalAmount: number
  items: BillItem[]
  editNote?: string
}

export type Bill = {
  id: number
  billNumber: string
  customerName: string
  phoneNumber: string
  items: BillItem[]
  subtotal: number
  gstRate: number
  gstType: "INCLUSIVE" | "EXCLUSIVE"
  gstAmount: number
  discount: number
  totalAmount: number
  createdAt: string
  updatedAt: string
  isEdited?: boolean
  editedAt?: string
  editHistory?: BillSnapshot[]   // full history of all past versions
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