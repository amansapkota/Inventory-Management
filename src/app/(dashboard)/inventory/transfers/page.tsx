'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface TransferItem {
  productId: string
  productName: string
  sku: string
  quantity: number
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; sku: string }>>([])
  const [fromWarehouseId, setFromWarehouseId] = useState('')
  const [toWarehouseId, setToWarehouseId] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<TransferItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadTransfers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/inventory/transfer?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setTransfers(data.data ?? data)
        setTotal(data.total ?? 0)
      }
    } catch { toast.error('Failed to load transfers') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTransfers() }, [page])

  useEffect(() => {
    if (showModal) {
      Promise.all([
        fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? [])),
        fetch('/api/products?limit=200').then(r => r.json()).then(d => setProducts(d.data ?? [])),
      ])
    }
  }, [showModal])

  function addItem() {
    if (!selectedProduct) return
    const product = products.find(p => p.id === selectedProduct)
    if (!product) return
    setItems([...items, { productId: product.id, productName: product.name, sku: product.sku, quantity: 1 }])
    setSelectedProduct('')
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fromWarehouseId || !toWarehouseId) { toast.error('Select warehouses'); return }
    if (fromWarehouseId === toWarehouseId) { toast.error('Cannot transfer to same warehouse'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromWarehouseId, toWarehouseId, items: items.map(i => ({ productId: i.productId, quantity: i.quantity })), note }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Transfer created')
      setShowModal(false)
      setFromWarehouseId(''); setToWarehouseId(''); setNote(''); setItems([])
      loadTransfers()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { key: 'referenceNo', label: 'Ref No', render: (item: { referenceNo: string }) => <span className="font-medium">{item.referenceNo}</span> },
    { key: 'fromWarehouse', label: 'From', render: (item: { fromWarehouse?: { name: string } }) => item.fromWarehouse?.name ?? '-' },
    { key: 'toWarehouse', label: 'To', render: (item: { toWarehouse?: { name: string } }) => item.toWarehouse?.name ?? '-' },
    { key: 'status', label: 'Status', render: (item: { status: string }) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (item: { createdAt: string }) => formatDate(item.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Stock Transfers" description={`${total} transfers`}>
        <Button onClick={() => { setItems([]); setFromWarehouseId(''); setToWarehouseId(''); setNote(''); setShowModal(true) }}>
          <Plus size={16} /> New Transfer
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={transfers} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Stock Transfer" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Warehouse</label>
              <Select value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select source" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Warehouse</label>
              <Select value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select destination" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Items</label>
            <div className="flex gap-2">
              <Select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} options={products.map(p => ({ label: `${p.name} (${p.sku})`, value: p.id }))} placeholder="Select product..." className="flex-1" />
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
                    const n = [...items]; n[idx].quantity = parseInt(e.target.value) || 1; setItems(n)
                  }} className="w-20" min={1} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-red-500"><Trash2 size={16} /></Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Transfer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
