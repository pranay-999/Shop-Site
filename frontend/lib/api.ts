const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// Types
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
  id: number;
  stockId: number;
  designName: string;
  noOfBoxes: number;
  pricePerBox: number;
  totalAmount: number;
}

export interface Bill {
  id: number;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  items: BillItem[];
  subtotal: number;
  gstRate: number;
  gstType: 'EXCLUSIVE' | 'INCLUSIVE';
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalItems: number;
  lowStockAlerts: number;
  todaySales: number;
  totalRevenue: number;
}

// Stock APIs
export async function getStocks() {
  const response = await fetch(`${API_BASE_URL}/stocks`);
  if (!response.ok) throw new Error('Failed to fetch stocks');
  return response.json() as Promise<Stock[]>;
}

export async function searchStocks(query: string) {
  const response = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search stocks');
  return response.json() as Promise<Stock[]>;
}

export async function getStockById(id: number) {
  const response = await fetch(`${API_BASE_URL}/stocks/${id}`);
  if (!response.ok) throw new Error('Failed to fetch stock');
  return response.json() as Promise<Stock>;
}

export async function createStock(data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch(`${API_BASE_URL}/stocks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create stock');
  return response.json() as Promise<Stock>;
}

export async function updateStock(id: number, data: Partial<Stock>) {
  const response = await fetch(`${API_BASE_URL}/stocks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update stock');
  return response.json() as Promise<Stock>;
}

export async function deleteStock(id: number) {
  const response = await fetch(`${API_BASE_URL}/stocks/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete stock');
}

export async function getLowStockItems() {
  const response = await fetch(`${API_BASE_URL}/stocks/low-stock`);
  if (!response.ok) throw new Error('Failed to fetch low stock items');
  return response.json() as Promise<Stock[]>;
}

// Bill APIs
export async function getBills() {
  const response = await fetch(`${API_BASE_URL}/bills`);
  if (!response.ok) throw new Error('Failed to fetch bills');
  return response.json() as Promise<Bill[]>;
}

export async function getBillById(id: number) {
  const response = await fetch(`${API_BASE_URL}/bills/${id}`);
  if (!response.ok) throw new Error('Failed to fetch bill');
  return response.json() as Promise<Bill>;
}

export async function getBillByNumber(billNumber: string) {
  const response = await fetch(`${API_BASE_URL}/bills/search/by-number?billNumber=${encodeURIComponent(billNumber)}`);
  if (!response.ok) throw new Error('Bill not found');
  return response.json() as Promise<Bill>;
}

export async function searchBills(customerName?: string, customerPhone?: string) {
  const params = new URLSearchParams();
  if (customerName) params.append('customerName', customerName);
  if (customerPhone) params.append('customerPhone', customerPhone);
  
  const response = await fetch(`${API_BASE_URL}/bills/search?${params}`);
  if (!response.ok) throw new Error('Failed to search bills');
  return response.json() as Promise<Bill[]>;
}

export async function createBill(data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch(`${API_BASE_URL}/bills`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create bill');
  return response.json() as Promise<Bill>;
}

export async function updateBill(id: number, data: Partial<Bill>) {
  const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update bill');
  return response.json() as Promise<Bill>;
}

export async function deleteBill(id: number) {
  const response = await fetch(`${API_BASE_URL}/bills/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete bill');
}

export async function checkBillNumberExists(billNumber: string) {
  const response = await fetch(`${API_BASE_URL}/bills/check-number?billNumber=${encodeURIComponent(billNumber)}`);
  if (!response.ok) throw new Error('Failed to check bill number');
  return response.json() as Promise<{ exists: boolean }>;
}

export async function getBillsByDateRange(startDate: string, endDate: string) {
  const response = await fetch(
    `${API_BASE_URL}/bills/filter?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  );
  if (!response.ok) throw new Error('Failed to fetch bills');
  return response.json() as Promise<Bill[]>;
}

// Dashboard APIs
export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json() as Promise<DashboardStats>;
}

export async function getRecentActivity(limit: number = 5) {
  const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch recent activity');
  return response.json();
}
