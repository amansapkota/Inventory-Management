'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { usePosStore } from '@/store/pos-store'
import { BarcodeScanner } from '@/components/barcode/barcode-scanner'
import { Search, Plus, Minus, Trash2, Printer, CreditCard, Wallet, Smartphone, User, X, ShoppingCart, Receipt, Barcode, Package } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import toast from 'react-hot-toast'

export default function PosPage() {
  const store = usePosStore()
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; sellingPrice: number; barcode?: string; images?: string }>>([])
  const [search, setSearch] = useState('')
  const [customers, setCustomers] = useState<Array<{ id: string; firstName: string; lastName: string; phone: string }>>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [paidAmount, setPaidAmount] = useState(store.getGrandTotal())
  const [scanningEnabled, setScanningEnabled] = useState(true)
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const productsRef = useRef(products)

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = productsRef.current.find(p => p.barcode === barcode)
    if (product) {
      const existing = store.cart.find(i => i.productId === product.id)
      if (existing) {
        store.updateQuantity(existing.id, existing.quantity + 1)
        toast.success(`Added another ${product.name}`, { duration: 1500 })
      } else {
        store.addToCart({
          id: product.id,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
          discountPercent: 0,
          taxRate: 0,
          taxAmount: 0,
          total: product.sellingPrice,
          image: product.images || undefined,
        })
        toast.success(`Scanned: ${product.name}`, { duration: 1500 })
      }
    } else {
      toast.error(`Product not found: ${barcode}`)
    }
  }, [store])

  useEffect(() => {
    productsRef.current = products
  }, [products])

  useEffect(() => {
    searchRef.current?.focus()
    loadProducts()
    loadCustomers()
    loadWarehouses()
  }, [])

  async function loadWarehouses() {
    try {
      const res = await fetch('/api/warehouses')
      if (res.ok) {
        const data = await res.json()
        const whs = data.data || []
        setWarehouses(whs)
        if (whs.length > 0 && !selectedWarehouse) setSelectedWarehouse(whs[0].id)
      }
    } catch {}
  }

  async function loadProducts() {
    try {
      const res = await fetch('/api/products?limit=200')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data)
      }
    } catch {}
  }

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers?limit=100')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.data)
      }
    } catch {}
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  )

  function addToCart(product: typeof products[0]) {
    store.addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      quantity: 1,
      unitPrice: product.sellingPrice,
      discount: 0,
      discountPercent: 0,
      taxRate: 0,
      taxAmount: 0,
      total: product.sellingPrice,
      image: product.images || undefined,
    })
  }

  function printReceipt() {
    const sale = store.lastSale
    if (!sale) { toast.error('No sale data to print'); return }

    const doc = new jsPDF({ unit: 'mm', format: [80, 200] })
    let y = 10

    doc.setFontSize(14)
    doc.text('RetailPro', 40, y, { align: 'center' })
    y += 5
    doc.setFontSize(8)
    doc.text('123 Main Street, Kathmandu', 40, y, { align: 'center' })
    y += 3
    doc.text('Phone: +977-1-4XXXXXX', 40, y, { align: 'center' })
    y += 6

    doc.setFontSize(9)
    doc.text(`Invoice: ${sale.invoiceNo}`, 4, y)
    doc.text(new Date().toLocaleDateString(), 40, y, { align: 'right' })
    y += 4
    if (sale.customerName) {
      doc.text(`Customer: ${sale.customerName}`, 4, y)
      y += 4
    }

    doc.setDrawColor(0)
    doc.line(4, y, 76, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: sale.items.map(i => [
        i.name.length > 18 ? i.name.slice(0, 18) + '..' : i.name,
        String(i.quantity),
        i.unitPrice.toFixed(2),
        i.total.toFixed(2),
      ]),
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 0.5 },
      headStyles: { fontStyle: 'bold' },
      tableWidth: 72,
      margin: { left: 4, right: 4 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3

    doc.line(4, y, 76, y)
    y += 3

    const lines = [
      ['Subtotal:', sale.subtotal.toFixed(2)],
      ['Discount:', `-${sale.discountTotal.toFixed(2)}`],
      ['Tax:', sale.taxTotal.toFixed(2)],
      ['Grand Total:', sale.grandTotal.toFixed(2)],
    ]
    lines.forEach(([label, val]) => {
      doc.setFontSize(label === 'Grand Total:' ? 11 : 9)
      doc.setFont('helvetica', label === 'Grand Total:' ? 'bold' : 'normal')
      doc.text(label, 4, y)
      doc.text(val, 76, y, { align: 'right' })
      y += label === 'Grand Total:' ? 6 : 4
    })

    y += 2
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Paid via: ${sale.paymentMethod}`, 4, y)
    y += 3
    doc.text(`Amount Paid: ${sale.paidAmount.toFixed(2)}`, 4, y)
    y += 6

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Thank you! Visit again!', 40, y, { align: 'center' })

    doc.save(`receipt-${sale.invoiceNo}.pdf`)
  }

  async function completeSale() {
    if (!store.cart.length) { toast.error('Cart is empty'); return }
    if (!selectedWarehouse) { toast.error('Select a warehouse'); return }

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: store.cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
          })),
          customerId: store.customerId,
          paymentMethod: store.paymentMethod,
          paidAmount,
          discount: store.discount,
          notes: store.note,
          warehouseId: selectedWarehouse,
          posData: { register: 'main' },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      store.setLastSale({
        invoiceNo: data.data?.invoiceNo ?? `INV-${Date.now()}`,
        items: [...store.cart],
        subtotal: store.getSubtotal(),
        discount: store.discount,
        discountTotal: store.getTotalDiscount(),
        taxTotal: store.getTaxTotal(),
        grandTotal: store.getGrandTotal(),
        paidAmount,
        paymentMethod: store.paymentMethod,
        customerName: store.customerName,
      })

      toast.success('Sale completed!')
      store.clearCart()
      setPaidAmount(0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sale failed')
    }
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-4">
      <BarcodeScanner onScan={handleBarcodeScan} enabled={scanningEnabled} />

      {/* Products Panel */}
      <div className="flex-1 flex flex-col">
        <div className="relative mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-lg h-11"
            />
          </div>
          <Button
            variant={scanningEnabled ? 'default' : 'outline'}
            size="icon"
            className={scanningEnabled ? 'h-11 w-11 bg-green-600 hover:bg-green-700 shrink-0' : 'h-11 w-11 shrink-0'}
            onClick={() => setScanningEnabled(!scanningEnabled)}
            title={scanningEnabled ? 'Scanner active' : 'Scanner off'}
          >
            <Barcode size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => addToCart(product)}>
                <CardContent className="p-3">
                  <div className="h-20 bg-muted rounded-md mb-2 flex items-center justify-center text-muted-foreground">
                    <ShoppingCart size={24} />
                  </div>
                  <div className="text-sm font-medium truncate">{product.name}</div>
                  <div className="text-xs text-muted-foreground">{product.sku}</div>
                  <div className="text-sm font-bold text-primary mt-1">{formatCurrency(product.sellingPrice)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-96 flex flex-col bg-card border rounded-xl">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Current Sale</h2>
            <Button variant="ghost" size="icon" onClick={() => store.setCustomer(null, null)}>
              <User size={18} />
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-sm"
            onClick={() => setShowCustomerModal(true)}
          >
            {store.customerName ? <>{store.customerName}</> : <>Walk-in Customer</>}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {store.cart.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} each</div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.updateQuantity(item.id, item.quantity - 1)}>
                  <Minus size={14} />
                </Button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => store.updateQuantity(item.id, item.quantity + 1)}>
                  <Plus size={14} />
                </Button>
              </div>
              <div className="text-sm font-bold w-20 text-right">{formatCurrency(item.total)}</div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => store.removeFromCart(item.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {store.cart.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
              <p>Search and click products to add</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t space-y-3">
          {warehouses.length > 0 && (
            <Select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              options={warehouses.map(w => ({ label: w.name, value: w.id }))}
              className="w-full text-xs"
            />
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(store.getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount ({store.discount}%)</span>
              <span className="text-red-500">-{formatCurrency(store.getTotalDiscount())}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>{formatCurrency(store.getTaxTotal())}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-1 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(store.getGrandTotal())}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {['CASH', 'CARD', 'ESEWA', 'KHALTI'].map((method) => (
              <Button
                key={method}
                variant={store.paymentMethod === method ? 'default' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => store.setPaymentMethod(method)}
              >
                {method === 'CASH' ? <Wallet size={14} /> : method === 'CARD' ? <CreditCard size={14} /> : <Smartphone size={14} />}
                <span className="ml-1">{method}</span>
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Paid amount"
              value={paidAmount}
              onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            />
            <Input
              type="number"
              placeholder="Discount %"
              value={store.discount}
              onChange={(e) => store.setGlobalDiscount(parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>

          <Button className="w-full h-12 text-lg" onClick={completeSale} disabled={!store.cart.length}>
            Complete Sale ({formatCurrency(store.getGrandTotal())})
          </Button>

          {store.lastSale && (
            <Button variant="outline" className="w-full" onClick={printReceipt}>
              <Receipt size={16} /> Print Receipt
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={store.clearCart}>
            <X size={16} /> Clear Cart
          </Button>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCustomerModal(false)}>
          <div className="bg-background rounded-xl p-6 w-96 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4">Select Customer</h3>
            <Input placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="mb-3" />
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => { store.setCustomer(null, null); setShowCustomerModal(false) }}>
                Walk-in Customer
              </Button>
              {customers.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(customerSearch.toLowerCase())).map(c => (
                <Button key={c.id} variant="ghost" className="w-full justify-start" onClick={() => { store.setCustomer(c.id, `${c.firstName} ${c.lastName}`); setShowCustomerModal(false) }}>
                  {c.firstName} {c.lastName} - {c.phone}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
