export interface Stock {
  id: number;
  designName: string;
  size: string;
  type: string;
  noOfBoxes: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  id?: number;
  stockId: number;
  designName: string;
  noOfBoxes: number;
  pricePerBox: number;
  totalAmount: number;
}

export interface Bill {
  id?: number;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  gstRate?: number;
  gstType?: 'EXCLUSIVE' | 'INCLUSIVE';
  gstAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockAlerts: number;
  todaySales: number;
  totalRevenue: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}
