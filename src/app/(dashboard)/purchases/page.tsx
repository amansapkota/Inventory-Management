'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Eye, Search } from 'lucide-react'
import { PurchaseForm } from './purchase-form'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Purchase {
  id: string
  purchaseOrderNo: string
  grandTotal: number
  paidAmount: number
  dueAmount: number
  status: string
  orderDate: string
  supplier: { id: string; name: string; phone: string } | null
  createdBy: { id: string; firstName: string; lastName: string } | null
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function loadPurchases() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/purchases?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed to load purchases') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadPurchases() }, [page, search, statusFilter])

  const columns = [
    { key: 'purchaseOrderNo', label: 'PO No', render: (item: Purchase) => (
      <Link href={`/purchases/${item.id}`} className="font-medium hover:underline">{item.purchaseOrderNo}</Link>
    )},
    { key: 'supplier', label: 'Supplier', render: (item: Purchase) => item.supplier?.name ?? '-' },
    { key: 'grandTotal', label: 'Total', render: (item: Purchase) => formatCurrency(item.grandTotal) },
    { key: 'paidAmount', label: 'Paid', render: (item: Purchase) => formatCurrency(item.paidAmount) },
    { key: 'dueAmount', label: 'Due', render: (item: Purchase) => <span className="text-red-500">{formatCurrency(item.dueAmount)}</span> },
    { key: 'status', label: 'Status', render: (item: Purchase) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'orderDate', label: 'Date', render: (item: Purchase) => formatDate(item.orderDate) },
    { key: 'actions', label: '', render: (item: Purchase) => (
      <Link href={`/purchases/${item.id}`}>
        <Button variant="ghost" size="icon"><Eye size={16} /></Button>
      </Link>
    )},
  ]

  return (
    <div>
      <PageHeader title="Purchases" description={`${total} purchase orders`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Purchase</Button>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PO or supplier..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-8"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={[
            { label: 'All Status', value: '' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Ordered', value: 'ORDERED' },
            { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
            { label: 'Received', value: 'RECEIVED' },
            { label: 'Cancelled', value: 'CANCELLED' },
            { label: 'Returned', value: 'RETURNED' },
          ]}
          className="w-48"
        />
      </div>

      <DataTable columns={columns} data={purchases as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Purchase Order" size="xl">
        <PurchaseForm onSuccess={() => { setShowForm(false); loadPurchases() }} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
