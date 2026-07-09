import { z } from 'zod'

const paymentMethods = ['CASH', 'CARD', 'QR_PAYMENT', 'ESEWA', 'KHALTI', 'BANK_TRANSFER', 'SPLIT_PAYMENT'] as const
const userRoles = ['SUPER_ADMIN', 'COMPANY_OWNER', 'BRANCH_MANAGER', 'CASHIER', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'ACCOUNTANT', 'HR', 'DELIVERY_STAFF', 'CUSTOMER', 'VENDOR'] as const
const attendanceStatuses = ['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE', 'HOLIDAY'] as const

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

export const registerSchema = z.object({
  companyName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  password: z.string().min(6),
})

export const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  unit: z.string().default('pcs'),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  wholesalePrice: z.number().optional(),
  minStock: z.number().int().default(0),
  maxStock: z.number().int().optional(),
  description: z.string().optional(),
  trackBatch: z.boolean(),
  trackExpiry: z.boolean(),
  warrantyPeriod: z.number().int().optional(),
})

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

export const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
})

export const customerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  creditLimit: z.number().optional(),
})

export const supplierSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().min(1),
  address: z.string().optional(),
  panNo: z.string().optional(),
})

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
  discount: z.number().default(0),
  taxRate: z.number().default(0),
})

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  customerId: z.string().optional(),
  paymentMethod: z.enum(paymentMethods),
  paidAmount: z.number().nonnegative(),
  discount: z.number().default(0),
  notes: z.string().optional(),
})

export const purchaseItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative(),
})

export const purchaseSchema = z.object({
  items: z.array(purchaseItemSchema).min(1),
  supplierId: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
})

export const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(userRoles),
  department: z.string().optional(),
  designation: z.string().optional(),
  salary: z.number().nonnegative(),
})

export const expenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  expenseDate: z.string().min(1),
})

export const inventoryAdjustSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  newQuantity: z.number().int().nonnegative(),
  reason: z.string().min(1),
})

export const stockTransferItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
})

export const stockTransferSchema = z.object({
  fromWarehouseId: z.string().min(1),
  toWarehouseId: z.string().min(1),
  items: z.array(stockTransferItemSchema).min(1),
  note: z.string().optional(),
})

export const attendanceSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
  status: z.enum(attendanceStatuses),
})

export const leaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1),
})

export const payrollSchema = z.object({
  employeeId: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  basicSalary: z.number().nonnegative(),
  allowances: z.number().default(0),
  deductions: z.number().default(0),
  commission: z.number().default(0),
  bonus: z.number().default(0),
})

export const settingsSchema = z.object({
  companyName: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  panNo: z.string().optional(),
  regNo: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().default('NPR'),
  taxRate: z.number().nonnegative().default(13),
  language: z.string().default('en'),
  lowStockThreshold: z.number().int().nonnegative().default(10),
  expiryWarningDays: z.number().int().nonnegative().default(30),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProductInput = z.infer<typeof productSchema>
export type CategoryInput = z.infer<typeof categorySchema>
export type BrandInput = z.infer<typeof brandSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type SupplierInput = z.infer<typeof supplierSchema>
export type SaleInput = z.infer<typeof saleSchema>
export type PurchaseInput = z.infer<typeof purchaseSchema>
export type EmployeeInput = z.infer<typeof employeeSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type InventoryAdjustInput = z.infer<typeof inventoryAdjustSchema>
export type StockTransferInput = z.infer<typeof stockTransferSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type LeaveInput = z.infer<typeof leaveSchema>
export type PayrollInput = z.infer<typeof payrollSchema>
export type SettingsInput = z.infer<typeof settingsSchema>
