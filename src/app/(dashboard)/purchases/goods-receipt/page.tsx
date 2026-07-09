'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReceiptLine {
  purchaseItemId: string
  productName: string
  sku: string
  orderedQty: number
  receivedQty: number
  quantity: number
  batchNo: string
  expDate: string
}

export default function GoodsReceiptPage() {
  const [receipts, setReceipts] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [purchases, setPurchases] = useState<Array<{ id: string; purchaseOrderNo: string; supplier?: { name: string } }>>([])
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ReceiptLine[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function loadReceipts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/goods-receipt?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setReceipts(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed to load receipts') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadReceipts() }, [page])

  useEffect(() => {
    if (showModal) {
      Promise.all([
        fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? [])),
        fetch('/api/purchases?limit=100').then(r => r.json()).then(d => {
          const list: Array<{ id: string; purchaseOrderNo: string; supplier?: { name: string } }> = (d.data ?? []).filter(
            (p: { status: string }) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED'
          )
          setPurchases(list)
        }),
      ])
    }
  }, [showModal])

  async function loadPurchaseItems(id: string) {
    try {
      const res = await fetch(`/api/purchases/${id}`)
      if (res.ok) {
        const data = await res.json()
        const purchase = data.data ?? data
        const lines: ReceiptLine[] = (purchase.items ?? []).map((i: { id: string; product: { name: string; sku: string }; quantity: number; receivedQty: number }) => ({
          purchaseItemId: i.id,
          productName: i.product.name,
          sku: i.product.sku,
          orderedQty: i.quantity,
          receivedQty: i.receivedQty,
          quantity: i.quantity - i.receivedQty,
          batchNo: '',
          expDate: '',
        }))
        setItems(lines)
      }
    } catch { toast.error('Failed to load purchase items') }
  }

  useEffect(() => {
    if (selectedPurchaseId) loadPurchaseItems(selectedPurchaseId)
  }, [selectedPurchaseId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPurchaseId || !warehouseId) { toast.error('Select purchase and warehouse'); return }
    const validItems = items.filter(i => i.quantity > 0)
    if (!validItems.length) { toast.error('No items to receive'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/purchases/goods-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: selectedPurchaseId, warehouseId, items: validItems, notes }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Goods receipt created')
      setShowModal(false)
      loadReceipts()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { key: 'receiptNo', label: 'Receipt No', render: (item: { receiptNo: string }) => <span className="font-medium">{item.receiptNo}</span> },
    { key: 'purchase', label: 'Purchase Order', render: (item: { purchase?: { purchaseOrderNo: string } }) => item.purchase?.purchaseOrderNo ?? '-' },
    { key: 'receivedAt', label: 'Date', render: (item: { receivedAt: string }) => formatDate(item.receivedAt) },
  ]

  function resetForm() {
    setSelectedPurchaseId(''); setWarehouseId(''); setNotes(''); setItems([])
  }

  return (
    <div>
      <PageHeader title="Goods Receipt" description={`${total} receipts`}>
        <Button onClick={() => { resetForm(); setShowModal(true) }}><Plus size={16} /> New Receipt</Button>
      </PageHeader>

      <DataTable columns={columns} data={receipts} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Goods Receipt" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Order</label>
              <Select value={selectedPurchaseId} onChange={(e) => setSelectedPurchaseId(e.target.value)} options={purchases.map(p => ({ label: `${p.purchaseOrderNo}${p.supplier ? ` - ${p.supplier.name}` : ''}`, value: p.id }))} placeholder="Select PO" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Receive Into Warehouse</label>
              <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select warehouse" />
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Items</label>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {items.map((item, idx) => (
                  <div key={item.purchaseItemId} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{item.sku} &middot; Ordered: {item.orderedQty} &middot; Received: {item.receivedQty}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <label className="text-xs">Qty</label>
                          <Input type="number" value={item.quantity} onChange={(e) => {
                            const n = [...items]; n[idx].quantity = parseInt(e.target.value) || 0; setItems(n)
                          }} className="w-20" min={0} max={item.orderedQty - item.receivedQty} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs">Batch No</label>
                        <Input value={item.batchNo} onChange={(e) => {
                          const n = [...items]; n[idx].batchNo = e.target.value; setItems(n)
                        }} placeholder="Optional" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs">Expiry Date</label>
                        <Input type="date" value={item.expDate} onChange={(e) => {
                          const n = [...items]; n[idx].expDate = e.target.value; setItems(n)
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Receipt'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
