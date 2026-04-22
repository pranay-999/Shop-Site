import { z } from 'zod';

// Stock validation — fields match StockDTO from the Java backend
export const stockSchema = z.object({
  designName: z.string().min(1, 'Design name is required'),
  size: z.string().min(1, 'Size is required'),
  type: z.string().min(1, 'Type is required'),
  totalBoxes: z.number().min(1, 'Number of boxes must be at least 1'),
  pricePerBox: z.number().min(0, 'Price must be a positive number'),
  categoryId: z.number().min(1, 'Category is required'),
});

export type StockFormData = z.infer<typeof stockSchema>;

// Bill Item validation — fields match BillItemDTO
export const billItemSchema = z.object({
  stockId: z.number().min(1, 'Stock item is required'),
  designName: z.string(),
  quantityBoxes: z.number().min(1, 'Quantity must be at least 1'),
  pricePerBox: z.number().min(0, 'Price must be a positive number'),
  totalPrice: z.number(),
});

export type BillItemFormData = z.infer<typeof billItemSchema>;

// Bill validation
export const billSchema = z.object({
  billNumber: z.string().min(1, 'Bill number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  items: z.array(billItemSchema).min(1, 'At least one item is required'),
  gstRate: z.number().min(0).optional(),
  gstType: z.enum(['EXCLUSIVE', 'INCLUSIVE']).optional(),
  discountAmount: z.number().min(0).optional(),
});

export type BillFormData = z.infer<typeof billSchema>;

// Customer search validation
export const customerSearchSchema = z.object({
  billNumber: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
}).refine(
  (data) => data.billNumber || data.customerName || data.customerPhone,
  {
    message: 'Please enter at least one search criteria',
    path: ['billNumber'],
  }
);

export type CustomerSearchData = z.infer<typeof customerSearchSchema>;

// Date range validation
export const dateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }
);

export type DateRangeData = z.infer<typeof dateRangeSchema>;
