'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface CountItem {
  productId: string
  productName: string
  sku: string
  systemQty: number
  physicalQty: number
}

export default function StockCountsPage() {
  const [counts, setCounts] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [stockData, setStockData] = useState<Array<{ productId: string; productName: string; sku: string; quantity: number }>>([])
  const [items, setItems] = useState<CountItem[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadCounts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory/counts?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setCounts(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed to load counts') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCounts() }, [page])

  async function loadStockForWarehouse(id: string) {
    try {
      const res = await fetch(`/api/inventory?warehouseId=${id}&limit=200`)
      if (res.ok) {
        const data = await res.json()
        const list: Array<{ productId: string; productName: string; sku: string; quantity: number }> = (data.data ?? []).map((s: { product: { id: string; name: string; sku: string }; quantity: number }) => ({
          productId: s.product.id,
          productName: s.product.name,
          sku: s.product.sku,
          quantity: s.quantity,
        }))
        setStockData(list)
        setItems(list.map(s => ({ ...s, systemQty: s.quantity, physicalQty: s.quantity })))
      }
    } catch { toast.error('Failed to load stock') }
  }

  useEffect(() => {
    if (showModal) {
      fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? []))
    }
  }, [showModal])

  useEffect(() => {
    if (warehouseId) loadStockForWarehouse(warehouseId)
  }, [warehouseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!warehouseId) { toast.error('Select warehouse'); return }
    if (!items.length) { toast.error('No items to count'); return }
    setSubmitting(true)
    try {
      const payload = items.map(i => ({
        productId: i.productId,
        warehouseId,
        systemQty: i.systemQty,
        physicalQty: i.physicalQty,
        difference: i.physicalQty - i.systemQty,
        note,
      }))
      const res = await fetch('/api/inventory/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Stock count recorded')
      setShowModal(false)
      loadCounts()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { key: 'product', label: 'Product', render: (item: { product?: { name: string; sku: string } }) => (
      <div><div className="font-medium">{item.product?.name}</div><div className="text-xs text-muted-foreground">{item.product?.sku}</div></div>
    )},
    { key: 'systemQty', label: 'System' },
    { key: 'physicalQty', label: 'Physical' },
    { key: 'difference', label: 'Diff', render: (item: { difference: number }) => (
      <span className={item.difference !== 0 ? 'text-red-500 font-bold' : ''}>{item.difference > 0 ? '+' : ''}{item.difference}</span>
    )},
    { key: 'countedAt', label: 'Date', render: (item: { countedAt: string }) => formatDate(item.countedAt) },
  ]

  return (
    <div>
      <PageHeader title="Stock Counts" description={`${total} count records`}>
        <Button onClick={() => { setWarehouseId(''); setItems([]); setStockData([]); setNote(''); setShowModal(true) }}>
          <Plus size={16} /> New Count
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={counts} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Stock Count" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Warehouse</label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select warehouse" />
          </div>

          {warehouseId && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Count Items</label>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {items.map((item, idx) => (
                  <div key={item.productId} className="flex gap-2 items-center border rounded-lg p-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.sku} &middot; System: {item.systemQty}</div>
                    </div>
                    <div>
                      <label className="text-xs">Physical</label>
                      <Input type="number" value={item.physicalQty} onChange={(e) => {
                        const n = [...items]; n[idx].physicalQty = parseInt(e.target.value) || 0; setItems(n)
                      }} className="w-20" />
                    </div>
                    <div className="text-sm pt-5 w-16 text-right">
                      {item.physicalQty - item.systemQty > 0 ? '+' : ''}{item.physicalQty - item.systemQty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting || !warehouseId}>{submitting ? 'Saving...' : 'Save Count'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
