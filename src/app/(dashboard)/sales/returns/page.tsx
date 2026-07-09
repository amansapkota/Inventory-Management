'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface SaleReturnItem {
  saleItemId: string
  quantity: number
  refundAmount: number
  reason: string
}

interface SaleReturn {
  id: string
  returnNo: string
  totalRefund: number
  status: string
  reason: string
  createdAt: string
  sale: { invoiceNo: string; customer: { firstName: string; lastName: string } | null }
  items: SaleReturnItem[]
}

interface SaleOption {
  id: string
  invoiceNo: string
  customer: { firstName: string; lastName: string } | null
  grandTotal: number
  items: { id: string; product: { name: string }; quantity: number; unitPrice: number; total: number }[]
}

export default function SaleReturnsPage() {
  const [returns, setReturns] = useState<SaleReturn[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [sales, setSales] = useState<SaleOption[]>([])
  const [selectedSale, setSelectedSale] = useState('')
  const [returnItems, setReturnItems] = useState<{ saleItemId: string; quantity: number; refundAmount: number; reason: string }[]>([])

  async function loadReturns() {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/returns?page=${page}&limit=20`)
      if (res.ok) { const d = await res.json(); setReturns(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load returns') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadReturns() }, [page])

  async function loadSales() {
    try {
      const res = await fetch('/api/sales?limit=100&status=COMPLETED')
      if (res.ok) { const d = await res.json(); setSales(d.data) }
    } catch { toast.error('Failed to load sales') }
  }

  function handleSaleSelect(saleId: string) {
    setSelectedSale(saleId)
    const sale = sales.find((s) => s.id === saleId)
    if (sale) {
      setReturnItems(sale.items.map((i) => ({ saleItemId: i.id, quantity: 0, refundAmount: 0, reason: '' })))
    }
  }

  function updateReturnItem(saleItemId: string, field: string, value: number | string) {
    setReturnItems((prev) => prev.map((ri) => ri.saleItemId === saleItemId ? { ...ri, [field]: value } : ri))
  }

  const totalRefund = returnItems.reduce((sum, ri) => sum + ri.refundAmount, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const items = returnItems.filter((ri) => ri.quantity > 0)
    if (!items.length) { toast.error('Select at least one item to return'); return }
    try {
      const res = await fetch('/api/sales/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: selectedSale, items }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Return created')
      setShowForm(false)
      setSelectedSale('')
      setReturnItems([])
      loadReturns()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'returnNo', label: 'Return No', render: (item: SaleReturn) => <span className="font-medium">{item.returnNo}</span> },
    { key: 'sale', label: 'Sale Invoice', render: (item: SaleReturn) => item.sale.invoiceNo },
    { key: 'customer', label: 'Customer', render: (item: SaleReturn) => item.sale.customer ? `${item.sale.customer.firstName} ${item.sale.customer.lastName}` : 'Walk-in' },
    { key: 'totalRefund', label: 'Total Refund', render: (item: SaleReturn) => formatCurrency(item.totalRefund) },
    { key: 'status', label: 'Status', render: (item: SaleReturn) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (item: SaleReturn) => formatDate(item.createdAt, 'datetime') },
  ]

  const saleOptions = sales.map((s) => ({
    label: `${s.invoiceNo} - ${s.customer ? `${s.customer.firstName} ${s.customer.lastName}` : 'Walk-in'} (${formatCurrency(s.grandTotal)})`,
    value: s.id,
  }))

  return (
    <div>
      <PageHeader title="Sale Returns" description={`${total} returns`}>
        <Button onClick={() => { setShowForm(true); loadSales() }}><Plus size={16} /> New Return</Button>
      </PageHeader>
      <DataTable columns={columns} data={returns as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Return" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Sale *</label>
            <Select value={selectedSale} onChange={(e) => handleSaleSelect(e.target.value)} options={saleOptions} placeholder="Choose a completed sale" />
          </div>
          {selectedSale && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Return Items</h3>
              <div className="border rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Item</th>
                      <th className="text-center p-2">Original Qty</th>
                      <th className="text-center p-2">Return Qty</th>
                      <th className="text-right p-2">Refund Amount</th>
                      <th className="p-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((ri) => {
                      const saleItem = sales.find((s) => s.id === selectedSale)?.items.find((i) => i.id === ri.saleItemId)
                      return (
                        <tr key={ri.saleItemId} className="border-b">
                          <td className="p-2">{saleItem?.product.name}</td>
                          <td className="text-center p-2">{saleItem?.quantity}</td>
                          <td className="text-center p-2">
                            <Input type="number" min={0} max={saleItem?.quantity} className="w-20 inline-block text-center"
                              value={ri.quantity || ''} onChange={(e) => updateReturnItem(ri.saleItemId, 'quantity', parseInt(e.target.value) || 0)} />
                          </td>
                          <td className="text-right p-2">
                            <Input type="number" min={0} step="0.01" className="w-28 inline-block text-right"
                              value={ri.refundAmount || ''} onChange={(e) => updateReturnItem(ri.saleItemId, 'refundAmount', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="p-2">
                            <Input value={ri.reason} onChange={(e) => updateReturnItem(ri.saleItemId, 'reason', e.target.value)} placeholder="Optional reason" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="text-right text-lg font-semibold">Total Refund: {formatCurrency(totalRefund)}</div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Create Return</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
