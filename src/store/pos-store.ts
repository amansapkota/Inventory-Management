'use client'

import { create } from 'zustand'

interface CartItem {
  id: string
  productId: string
  name: string
  sku: string
  barcode?: string
  quantity: number
  unitPrice: number
  discount: number
  discountPercent: number
  taxRate: number
  taxAmount: number
  total: number
  image?: string
}

interface LastSale {
  invoiceNo: string
  items: CartItem[]
  subtotal: number
  discount: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  paidAmount: number
  paymentMethod: string
  customerName: string | null
}

interface PosState {
  cart: CartItem[]
  customerId: string | null
  customerName: string | null
  discount: number
  paymentMethod: string
  note: string
  lastSale: LastSale | null
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateDiscount: (id: string, discount: number) => void
  setCustomer: (id: string | null, name: string | null) => void
  setGlobalDiscount: (discount: number) => void
  setPaymentMethod: (method: string) => void
  setNote: (note: string) => void
  setLastSale: (sale: LastSale) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotalDiscount: () => number
  getTaxTotal: () => number
  getGrandTotal: () => number
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  customerId: null,
  customerName: null,
  discount: 0,
  paymentMethod: 'CASH',
  note: '',
  lastSale: null,

  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
              : i
          ),
        }
      }
      return { cart: [...state.cart, item] }
    })
  },

  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.id !== id),
    }))
  },

  updateQuantity: (id, quantity) => {
    if (quantity < 1) return
    set((state) => ({
      cart: state.cart.map((i) =>
        i.id === id ? { ...i, quantity, total: quantity * i.unitPrice } : i
      ),
    }))
  },

  updateDiscount: (id, discount) => {
    set((state) => ({
      cart: state.cart.map((i) =>
        i.id === id
          ? { ...i, discount, discountPercent: (discount / i.unitPrice) * 100 }
          : i
      ),
    }))
  },

  setCustomer: (customerId, customerName) => set({ customerId, customerName }),
  setGlobalDiscount: (discount) => set({ discount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setNote: (note) => set({ note }),
  setLastSale: (sale) => set({ lastSale: sale }),
  clearCart: () => set({ cart: [], customerId: null, customerName: null, discount: 0, note: '' }),

  getSubtotal: () => get().cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  getTotalDiscount: () => {
    const { cart, discount } = get()
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount * item.quantity, 0)
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const globalDiscount = subtotal * (discount / 100)
    return itemDiscounts + globalDiscount
  },
  getTaxTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.taxAmount * item.quantity, 0)
  },
  getGrandTotal: () => {
    const subtotal = get().getSubtotal()
    const discount = get().getTotalDiscount()
    const tax = get().getTaxTotal()
    return subtotal - discount + tax
  },
}))
