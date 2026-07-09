'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/layout/page-header'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, PackageCheck, RotateCcw, Trash2 } from 'lucide-react'
import { Select } from '@/components/ui/select'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PurchaseItem {
  id: string
  quantity: number
  receivedQty: number
  unitPrice: number
  discount: number
  taxRate: number
  taxAmount: number
  total: number
  product: { id: string; name: string; sku: string }
}

interface PurchasePayment {
  id: string
  method: string
  amount: number
  referenceNo: string | null
  paidAt: string
}

interface GoodsReceipt {
  id: string
  receiptNo: string
  notes: string | null
  receivedAt: string
  items: Array<{ id: string; quantity: number }>
}

interface PurchaseReturn {
  id: string
  returnNo: string
  reason: string
  status: string
  totalRefund: number
  createdAt: string
  items: Array<{ id: string; quantity: number; refundAmount: number }>
}

interface PurchaseDetail {
  id: string
  purchaseOrderNo: string
  status: string
  orderDate: string
  expectedDate: string | null
  receivedDate: string | null
  subtotal: number
  discountTotal: number
  taxTotal: number
  shippingTotal: number
  grandTotal: number
  paidAmount: number
  dueAmount: number
  notes: string | null
  createdAt: string
  branch: { id: string; name: string }
  supplier: { id: string; name: string; phone: string } | null
  createdBy: { id: string; firstName: string; lastName: string } | null
  items: PurchaseItem[]
  payments: PurchasePayment[]
  goodsReceipt: GoodsReceipt[]
  returns: PurchaseReturn[]
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReceive, setShowReceive] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [id, setId] = useState<string | null>(null)

  // Goods receipt form state
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([])
  const [warehouseId, setWarehouseId] = useState('')
  const [receiveNotes, setReceiveNotes] = useState('')
  const [receiveItems, setReceiveItems] = useState<Array<{ purchaseItemId: string; productName: string; sku: string; orderedQty: number; receivedQty: number; quantity: number; batchNo: string; expDate: string }>>([])
  const [receiving, setReceiving] = useState(false)

  // Return form state
  const [returnReason, setReturnReason] = useState('')
  const [returnItems, setReturnItems] = useState<Array<{ purchaseItemId: string; productName: string; sku: string; receivedQty: number; quantity: number; reason: string; unitPrice: number }>>([])
  const [returning, setReturning] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  async function loadPurchase() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/purchases/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPurchase(data.data)
      } else {
        toast.error('Purchase not found')
      }
    } catch {
      toast.error('Failed to load purchase')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPurchase() }, [id])

  // Initialize goods receipt form when modal opens
  useEffect(() => {
    if (showReceive && purchase) {
      fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? []))
      setReceiveItems(purchase.items.map(i => ({
        purchaseItemId: i.id,
        productName: i.product.name,
        sku: i.product.sku,
        orderedQty: i.quantity,
        receivedQty: i.receivedQty,
        quantity: i.quantity - i.receivedQty,
        batchNo: '',
        expDate: '',
      })))
    }
  }, [showReceive, purchase])

  // Initialize return form when modal opens
  useEffect(() => {
    if (showReturn && purchase) {
      fetch('/api/warehouses').then(r => r.json()).then(d => setWarehouses(d.data ?? []))
      setReturnItems(purchase.items.map(i => ({
        purchaseItemId: i.id,
        productName: i.product.name,
        sku: i.product.sku,
        receivedQty: i.receivedQty,
        quantity: 0,
        reason: '',
        unitPrice: i.unitPrice,
      })))
    }
  }, [showReturn, purchase])

  async function handleReceiveGoods(e: React.FormEvent) {
    e.preventDefault()
    if (!warehouseId) { toast.error('Select warehouse'); return }
    const validItems = receiveItems.filter(i => i.quantity > 0)
    if (!validItems.length) { toast.error('No items to receive'); return }
    setReceiving(true)
    try {
      const res = await fetch('/api/purchases/goods-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: id, warehouseId, items: validItems, notes: receiveNotes }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Goods received successfully')
      setShowReceive(false)
      loadPurchase()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setReceiving(false) }
  }

  async function handleProcessReturn(e: React.FormEvent) {
    e.preventDefault()
    if (!warehouseId) { toast.error('Select warehouse'); return }
    if (!returnReason.trim()) { toast.error('Enter return reason'); return }
    const validItems = returnItems.filter(i => i.quantity > 0)
    if (!validItems.length) { toast.error('Select items to return'); return }
    setReturning(true)
    try {
      const res = await fetch('/api/purchases/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: id, warehouseId, reason: returnReason, items: validItems.map(i => ({ purchaseItemId: i.purchaseItemId, quantity: i.quantity, reason: i.reason || returnReason })) }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Return processed')
      setShowReturn(false)
      loadPurchase()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
    finally { setReturning(false) }
  }

  if (loading || !purchase) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{loading ? 'Loading...' : 'Purchase not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`PO ${purchase.purchaseOrderNo}`} description={`Status: ${purchase.status}`}>
        <Link href="/purchases">
          <Button variant="outline"><ArrowLeft size={16} /> Back to Purchases</Button>
        </Link>
        <Button variant="outline" onClick={() => setShowReceive(true)}>
          <PackageCheck size={16} /> Receive Goods
        </Button>
        <Button onClick={() => setShowReturn(true)}>
          <RotateCcw size={16} /> Process Return
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Purchase Order Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">PO No</span><span className="font-medium">{purchase.purchaseOrderNo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={getStatusColor(purchase.status)}>{purchase.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Order Date</span><span>{formatDate(purchase.orderDate)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expected Date</span><span>{purchase.expectedDate ? formatDate(purchase.expectedDate) : '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Received Date</span><span>{purchase.receivedDate ? formatDate(purchase.receivedDate) : '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Supplier</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {purchase.supplier ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{purchase.supplier.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{purchase.supplier.phone}</span></div>
              </>
            ) : (
              <p className="text-muted-foreground">No supplier</p>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Created By</span><span>{purchase.createdBy ? `${purchase.createdBy.firstName} ${purchase.createdBy.lastName}` : '-'}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span className="font-medium text-green-600">{formatCurrency(purchase.paidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-medium text-red-500">{formatCurrency(purchase.dueAmount)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Ordered</th>
                  <th className="pb-3 font-medium text-right">Received</th>
                  <th className="pb-3 font-medium text-right">Unit Price</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {item.product.sku}</div>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{item.receivedQty}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={4} className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right">{formatCurrency(purchase.subtotal)}</td></tr>
                {purchase.discountTotal > 0 && (
                  <tr><td colSpan={4} className="text-right text-muted-foreground">Discount</td><td className="text-right text-red-500">-{formatCurrency(purchase.discountTotal)}</td></tr>
                )}
                {purchase.taxTotal > 0 && (
                  <tr><td colSpan={4} className="text-right text-muted-foreground">Tax</td><td className="text-right">{formatCurrency(purchase.taxTotal)}</td></tr>
                )}
                <tr className="font-bold"><td colSpan={4} className="pt-2 text-right">Grand Total</td><td className="pt-2 text-right">{formatCurrency(purchase.grandTotal)}</td></tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {purchase.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{p.method}</td>
                    <td className="py-3 text-right">{formatCurrency(p.amount)}</td>
                    <td className="py-3">{p.referenceNo ?? '-'}</td>
                    <td className="py-3">{formatDate(p.paidAt, 'datetime')}</td>
                  </tr>
                ))}
                {purchase.payments.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No payments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {purchase.goodsReceipt.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Goods Receipts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {purchase.goodsReceipt.map((gr) => (
              <div key={gr.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{gr.receiptNo}</span>
                  <span className="text-sm text-muted-foreground">{formatDate(gr.receivedAt, 'datetime')}</span>
                </div>
                {gr.notes && <p className="text-sm text-muted-foreground">{gr.notes}</p>}
                <p className="text-xs text-muted-foreground mt-1">{gr.items.length} item(s)</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {purchase.returns.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {purchase.returns.map((ret) => (
              <div key={ret.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{ret.returnNo}</span>
                    <Badge className={`ml-2 ${getStatusColor(ret.status)}`}>{ret.status}</Badge>
                  </div>
                  <span className="font-medium text-red-500">{formatCurrency(ret.totalRefund)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{ret.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDate(ret.createdAt, 'datetime')}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Modal open={showReceive} onClose={() => setShowReceive(false)} title="Receive Goods" size="lg">
        <form onSubmit={handleReceiveGoods} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Receive Into Warehouse</label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select warehouse" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Items to Receive</label>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {receiveItems.map((item, idx) => (
                <div key={item.purchaseItemId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.sku} &middot; Ordered: {item.orderedQty} &middot; Received: {item.receivedQty}</div>
                    </div>
                    <div>
                      <label className="text-xs">Qty to receive</label>
                      <Input type="number" value={item.quantity} onChange={(e) => {
                        const n = [...receiveItems]; n[idx].quantity = parseInt(e.target.value) || 0; setReceiveItems(n)
                      }} className="w-20" min={0} max={item.orderedQty - item.receivedQty} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs">Batch No</label>
                      <Input value={item.batchNo} onChange={(e) => {
                        const n = [...receiveItems]; n[idx].batchNo = e.target.value; setReceiveItems(n)
                      }} placeholder="Optional" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs">Expiry Date</label>
                      <Input type="date" value={item.expDate} onChange={(e) => {
                        const n = [...receiveItems]; n[idx].expDate = e.target.value; setReceiveItems(n)
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={receiveNotes} onChange={(e) => setReceiveNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowReceive(false)}>Cancel</Button>
            <Button type="submit" disabled={receiving}>{receiving ? 'Receiving...' : 'Confirm Receipt'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showReturn} onClose={() => setShowReturn(false)} title="Process Return" size="lg">
        <form onSubmit={handleProcessReturn} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Return From Warehouse</label>
            <Select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} options={warehouses.map(w => ({ label: w.name, value: w.id }))} placeholder="Select warehouse" />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Items to Return</label>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {returnItems.map((item, idx) => (
                <div key={item.purchaseItemId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.sku} &middot; Received: {item.receivedQty} @ {formatCurrency(item.unitPrice)}</div>
                    </div>
                    <div>
                      <label className="text-xs">Qty to return</label>
                      <Input type="number" value={item.quantity} onChange={(e) => {
                        const n = [...returnItems]; n[idx].quantity = parseInt(e.target.value) || 0; setReturnItems(n)
                      }} className="w-20" min={0} max={item.receivedQty} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs">Reason (optional)</label>
                    <Input value={item.reason} onChange={(e) => {
                      const n = [...returnItems]; n[idx].reason = e.target.value; setReturnItems(n)
                    }} placeholder="e.g., Damaged, Wrong item" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Overall Reason</label>
            <textarea className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Reason for return" required />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowReturn(false)}>Cancel</Button>
            <Button type="submit" disabled={returning}>{returning ? 'Processing...' : 'Process Return'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
