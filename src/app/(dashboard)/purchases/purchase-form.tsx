'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PurchaseFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string; purchasePrice: number }>>([])
  const [supplierId, setSupplierId] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; productName: string; sku: string; quantity: number; unitPrice: number }>>([])
  const [selectedProduct, setSelectedProduct] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(d.data || [])),
      fetch('/api/products?limit=100').then(r => r.json()).then(d => setProducts(d.data || [])),
    ])
  }, [])

  function addItem() {
    if (!selectedProduct) return
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    setItems([...items, { productId: product.id, productName: product.name, sku: product.sku, quantity: 1, unitPrice: product.purchasePrice }])
    setSelectedProduct('')
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!items.length) { toast.error('Add at least one item'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, supplierId: supplierId || null, expectedDate, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Purchase order created')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={suppliers.map(s => ({ label: s.name, value: s.id }))} placeholder="Select supplier" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Expected Delivery</label>
          <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium">Items</label>
        <div className="flex gap-2">
          <Select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Search product..." className="flex-1" />
          <Button type="button" onClick={addItem} size="icon"><Plus size={16} /></Button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-end border rounded-lg p-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{item.productName}</div>
              <div className="text-xs text-muted-foreground">{item.sku}</div>
            </div>
            <div>
              <label className="text-xs">Qty</label>
              <Input type="number" value={item.quantity} onChange={(e) => {
                const newItems = [...items]
                newItems[idx].quantity = parseInt(e.target.value) || 1
                setItems(newItems)
              }} className="w-20" min={1} />
            </div>
            <div>
              <label className="text-xs">Price</label>
              <Input type="number" value={item.unitPrice} onChange={(e) => {
                const newItems = [...items]
                newItems[idx].unitPrice = parseFloat(e.target.value) || 0
                setItems(newItems)
              }} className="w-24" step="0.01" />
            </div>
            <div className="text-sm font-medium pt-5">{formatCurrency(item.quantity * item.unitPrice)}</div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-red-500">
              <Trash2 size={16} />
            </Button>
          </div>
        ))}

        <div className="text-right font-medium text-lg">Total: {formatCurrency(subtotal)}</div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Purchase Order'}</Button>
      </div>
    </form>
  )
}
