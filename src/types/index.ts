import type { User, Branch, Company, Product, Customer, Supplier, Sale, Purchase } from '@prisma/client'

export type SafeUser = Omit<User, 'passwordHash'> & {
  company: Pick<Company, 'id' | 'name' | 'logo'>
  branch: Pick<Branch, 'id' | 'name' | 'code'> | null
}

export interface DashboardStats {
  todaySales: number
  weeklySales: number
  monthlyRevenue: number
  totalExpenses: number
  totalProfit: number
  totalOrders: number
  pendingOrders: number
  lowStockCount: number
  totalProducts: number
  totalCustomers: number
  totalEmployees: number
}

export interface SaleWithItems extends Sale {
  items: Array<{
    id: string
    product: Pick<Product, 'id' | 'name' | 'sku'>
    quantity: number
    unitPrice: number
    total: number
  }>
  customer: Pick<Customer, 'id' | 'firstName' | 'lastName' | 'phone'> | null
  cashier: Pick<User, 'id' | 'firstName' | 'lastName'>
  branch: Pick<Branch, 'id' | 'name'>
}

export interface PurchaseWithItems extends Purchase {
  items: Array<{
    id: string
    product: Pick<Product, 'id' | 'name' | 'sku'>
    quantity: number
    unitPrice: number
    total: number
  }>
  supplier: Pick<Supplier, 'id' | 'name' | 'phone'> | null
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SelectOption {
  label: string
  value: string
}

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}
