'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReturnItem {
  purchaseItemId: string
  productName: string
  sku: string
  orderedQty: number
  receivedQty: number
  quantity: number
  reason: string
  unitPrice: number
}

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [purchases, setPurchases] = useState<Array<{ id: string; purchaseOrderNo: string; supplier?: { name: string } }>>([])
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [reason, setReason] = useState('')
  const [items, setItems] = useState<ReturnItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  async function loadReturns() {
    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/returns?page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed to load returns') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadReturns() }, [page])

  useEffect(() => {
    if (showModal) {
      Promise.all([
        fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? [])),
        fetch('/api/purchases?limit=100').then(r => r.json()).then(d => {
          const list: Array<{ id: string; purchaseOrderNo: string; supplier?: { name: string } }> = (d.data ?? []).filter(
            (p: { status: string }) => p.status === 'RECEIVED' || p.status === 'PARTIALLY_RECEIVED'
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
        const lines: ReturnItem[] = (purchase.items ?? [])
          .filter((i: { receivedQty: number }) => i.receivedQty > 0)
          .map((i: { id: string; product: { name: string; sku: string }; quantity: number; receivedQty: number; unitPrice: number }) => ({
            purchaseItemId: i.id,
            productName: i.product.name,
            sku: i.product.sku,
            orderedQty: i.quantity,
            receivedQty: i.receivedQty,
            quantity: 0,
            reason: '',
            unitPrice: i.unitPrice,
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
    if (!selectedPurchaseId) { toast.error('Select purchase'); return }
    if (!warehouseId) { toast.error('Select warehouse'); return }
    if (!reason.trim()) { toast.error('Enter a return reason'); return }
    const validItems = items.filter(i => i.quantity > 0)
    if (!validItems.length) { toast.error('Select items and quantities to return'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: selectedPurchaseId, warehouseId, reason, items: validItems.map(i => ({ purchaseItemId: i.purchaseItemId, quantity: i.quantity, reason: i.reason || reason })) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Return created')
      setShowModal(false)
      loadReturns()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setSubmitting(false) }
  }

  const columns = [
    { key: 'returnNo', label: 'Return No', render: (item: { returnNo: string }) => <span className="font-medium">{item.returnNo}</span> },
    { key: 'purchase', label: 'Purchase', render: (item: { purchase?: { purchaseOrderNo: string } }) => item.purchase?.purchaseOrderNo ?? '-' },
    { key: 'totalRefund', label: 'Refund', render: (item: { totalRefund: number }) => formatCurrency(item.totalRefund) },
    { key: 'status', label: 'Status', render: (item: { status: string }) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (item: { createdAt: string }) => formatDate(item.createdAt) },
  ]

  function resetForm() {
    setSelectedPurchaseId(''); setWarehouseId(''); setReason(''); setItems([])
  }

  return (
    <div>
      <PageHeader title="Purchase Returns" description={`${total} returns`}>
        <Button onClick={() => { resetForm(); setShowModal(true) }}><Plus size={16} /> New Return</Button>
      </PageHeader>

      <DataTable columns={columns} data={returns} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Purchase Return" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Purchase Order</label>
            <Select value={selectedPurchaseId} onChange={(e) => setSelectedPurchaseId(e.target.value)} options={purchases.map(p => ({ label: `${p.purchaseOrderNo}${p.supplier ? ` - ${p.supplier.name}` : ''}`, value: p.id }))} placeholder="Select purchase" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Warehouse (return from)</label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select warehouse" />
          </div>

          {items.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Items to Return</label>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {items.map((item, idx) => (
                  <div key={item.purchaseItemId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">{item.sku} &middot; Received: {item.receivedQty} @ {formatCurrency(item.unitPrice)}</div>
                      </div>
                      <div>
                        <label className="text-xs">Qty to return</label>
                        <Input type="number" value={item.quantity} onChange={(e) => {
                          const n = [...items]; n[idx].quantity = parseInt(e.target.value) || 0; setItems(n)
                        }} className="w-20" min={0} max={item.receivedQty} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-xs">Reason (optional)</label>
                      <Input value={item.reason} onChange={(e) => {
                        const n = [...items]; n[idx].reason = e.target.value; setItems(n)
                      }} placeholder="e.g., Damaged, Wrong item" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Overall Reason</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for return" required />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Return'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
