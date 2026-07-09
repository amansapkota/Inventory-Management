'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/layout/page-header'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Printer, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  taxAmount: number
  total: number
  product: { id: string; name: string; sku: string }
}

interface SalePayment {
  id: string
  method: string
  amount: number
  referenceNo: string | null
}

interface SaleReturn {
  id: string
  returnNo: string
  reason: string
  status: string
  totalRefund: number
  createdAt: string
  items: Array<{ id: string; quantity: number; refundAmount: number }>
}

interface SaleDetail {
  id: string
  invoiceNo: string
  status: string
  subtotal: number
  discountTotal: number
  taxTotal: number
  grandTotal: number
  paidAmount: number
  changeAmount: number
  dueAmount: number
  paymentMethod: string
  notes: string | null
  createdAt: string
  branch: { id: string; name: string }
  cashier: { id: string; firstName: string; lastName: string }
  customer: { id: string; firstName: string; lastName: string; phone: string } | null
  items: SaleItem[]
  payments: SalePayment[]
  saleReturns: SaleReturn[]
}

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [sale, setSale] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReturn, setShowReturn] = useState(false)
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  async function loadSale() {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSale(data.data)
      } else {
        toast.error('Sale not found')
      }
    } catch {
      toast.error('Failed to load sale')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadSale() }, [id])

  if (loading || !sale) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{loading ? 'Loading...' : 'Sale not found'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Invoice ${sale.invoiceNo}`} description={`Status: ${sale.status}`}>
        <Link href="/sales">
          <Button variant="outline"><ArrowLeft size={16} /> Back to Sales</Button>
        </Link>
        <Button variant="outline" onClick={() => toast.success('Print feature coming soon')}>
          <Printer size={16} /> Print Invoice
        </Button>
        <Button onClick={() => setShowReturn(true)}>
          <RotateCcw size={16} /> Process Return
        </Button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Invoice Info</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Invoice No</span><span className="font-medium">{sale.invoiceNo}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={getStatusColor(sale.status)}>{sale.status}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(sale.createdAt, 'datetime')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{sale.branch.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Cashier</span><span>{sale.cashier.firstName} {sale.cashier.lastName}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {sale.customer ? (
              <>
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{sale.customer.firstName} {sale.customer.lastName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{sale.customer.phone}</span></div>
              </>
            ) : (
              <p className="text-muted-foreground">Walk-in Customer</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Payment Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Paid Amount</span><span className="font-medium text-green-600">{formatCurrency(sale.paidAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Change</span><span>{formatCurrency(sale.changeAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span className="font-medium text-red-500">{formatCurrency(sale.dueAmount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{sale.paymentMethod}</span></div>
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
                  <th className="pb-3 font-medium text-right">Qty</th>
                  <th className="pb-3 font-medium text-right">Unit Price</th>
                  <th className="pb-3 font-medium text-right">Discount</th>
                  <th className="pb-3 font-medium text-right">Tax</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">SKU: {item.product.sku}</div>
                    </td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right">{item.discount > 0 ? formatCurrency(item.discount) : '-'}</td>
                    <td className="py-3 text-right">{item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '-'}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={5} className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right">{formatCurrency(sale.subtotal)}</td></tr>
                {sale.discountTotal > 0 && (
                  <tr><td colSpan={5} className="text-right text-muted-foreground">Discount</td><td className="text-right text-red-500">-{formatCurrency(sale.discountTotal)}</td></tr>
                )}
                <tr><td colSpan={5} className="text-right text-muted-foreground">Tax</td><td className="text-right">{formatCurrency(sale.taxTotal)}</td></tr>
                <tr className="font-bold"><td colSpan={5} className="pt-2 text-right">Grand Total</td><td className="pt-2 text-right">{formatCurrency(sale.grandTotal)}</td></tr>
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
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{p.method}</td>
                    <td className="py-3 text-right">{formatCurrency(p.amount)}</td>
                    <td className="py-3">{p.referenceNo ?? '-'}</td>
                  </tr>
                ))}
                {sale.payments.length === 0 && (
                  <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No payments recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {sale.saleReturns.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Returns</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sale.saleReturns.map((ret) => (
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

      <Modal open={showReturn} onClose={() => setShowReturn(false)} title="Process Return" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Process a return for Invoice <strong>{sale.invoiceNo}</strong>.
          </p>
          <p className="text-sm">
            You can process returns from the Sales Returns page. Select the sale invoice and choose items to return with refund amounts.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowReturn(false)}>Cancel</Button>
            <Link href="/sales/returns">
              <Button>Go to Returns Page</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
