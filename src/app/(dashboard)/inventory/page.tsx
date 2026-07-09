'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface StockItem {
  id: string
  quantity: number
  minStock: number
  product: { id: string; name: string; sku: string; sellingPrice: number; minStock: number }
  warehouse: { id: string; name: string; code: string }
}

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null)
  const [newQty, setNewQty] = useState(0)
  const [reason, setReason] = useState('')

  async function loadStock() {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setStock(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadStock() }, [page])

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault()
    if (!adjustItem) return
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: adjustItem.product.id, warehouseId: adjustItem.warehouse.id, newQuantity: newQty, reason }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Stock adjusted')
      setShowAdjust(false)
      loadStock()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'product', label: 'Product', render: (item: StockItem) => (
      <div><div className="font-medium">{item.product.name}</div><div className="text-xs text-muted-foreground">{item.product.sku}</div></div>
    )},
    { key: 'warehouse', label: 'Warehouse', render: (item: StockItem) => item.warehouse.name },
    { key: 'quantity', label: 'Stock', render: (item: StockItem) => (
      <div className="flex items-center gap-2">
        <span className={item.quantity <= (item.product.minStock || 0) ? 'text-red-500 font-bold' : ''}>{item.quantity}</span>
        {item.quantity <= (item.product.minStock || 0) && <AlertTriangle size={16} className="text-red-500" />}
      </div>
    )},
    { key: 'sellingPrice', label: 'Value', render: (item: StockItem) => formatCurrency(item.quantity * item.product.sellingPrice) },
    { key: 'actions', label: '', render: (item: StockItem) => (
      <Button variant="ghost" size="sm" onClick={() => { setAdjustItem(item); setNewQty(item.quantity); setReason(''); setShowAdjust(true) }}>
        Adjust
      </Button>
    )},
  ]

  return (
    <div>
      <PageHeader title="Inventory" description={`${total} stock records`} />

      <DataTable columns={columns} data={stock as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <form onSubmit={handleAdjust} className="space-y-4">
          {adjustItem && (
            <div>
              <p className="font-medium">{adjustItem.product.name}</p>
              <p className="text-sm text-muted-foreground">Current: {adjustItem.quantity}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Quantity</label>
            <Input type="number" value={newQty} onChange={(e) => setNewQty(parseInt(e.target.value) || 0)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Damaged, Lost, Found" required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button type="submit">Save Adjustment</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
