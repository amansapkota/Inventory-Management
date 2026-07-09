import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'NPR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const d = new Date(date)
  const options: Intl.DateTimeFormatOptions = {
    ...(format === 'short' && { year: 'numeric', month: 'short', day: 'numeric' }),
    ...(format === 'long' && { year: 'numeric', month: 'long', day: 'numeric' }),
    ...(format === 'datetime' && { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }
  return d.toLocaleDateString('en-US', options)
}

export function generateCode(prefix: string, num: number): string {
  return `${prefix}-${String(num).padStart(6, '0')}`
}

export function generateSku(category: string, brand: string, id: string): string {
  const cat = category.slice(0, 3).toUpperCase()
  const brd = brand.slice(0, 3).toUpperCase()
  const num = id.slice(-6).toUpperCase()
  return `${cat}-${brd}-${num}`
}

export function calculateDiscount(price: number, discountPercent: number): number {
  return price * (discountPercent / 100)
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
    returned: 'bg-orange-100 text-orange-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    open: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    ordered: 'bg-blue-100 text-blue-800',
    received: 'bg-green-100 text-green-800',
    low: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-green-100 text-green-800',
  }
  return colors[status.toLowerCase()] ?? 'bg-gray-100 text-gray-800'
}

export function parseJsonField<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try { return JSON.parse(value) as T }
  catch { return null }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
