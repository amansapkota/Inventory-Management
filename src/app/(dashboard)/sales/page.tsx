'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Sale {
  id: string
  invoiceNo: string
  grandTotal: number
  paidAmount: number
  dueAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  customer: { firstName: string; lastName: string; phone: string } | null
  cashier: { firstName: string; lastName: string }
  branch: { name: string }
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [branchId, setBranchId] = useState('')
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])

  async function loadBranches() {
    try {
      const res = await fetch('/api/branches?limit=100')
      if (res.ok) {
        const data = await res.json()
        setBranches(data.data ?? [])
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBranches() }, [])

  async function loadSales() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (branchId) params.set('branchId', branchId)
      const res = await fetch(`/api/sales?${params}`)
      if (res.ok) {
        const data = await res.json()
        setSales(data.data)
        setTotal(data.total)
      }
    } catch { toast.error('Failed to load sales') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSales() }, [page, search, statusFilter, branchId])

  const columns = [
    { key: 'invoiceNo', label: 'Invoice', render: (item: Sale) => (
      <Link href={`/sales/${item.id}`} className="font-medium hover:underline">{item.invoiceNo}</Link>
    )},
    { key: 'customer', label: 'Customer', render: (item: Sale) => item.customer ? `${item.customer.firstName} ${item.customer.lastName}` : 'Walk-in' },
    { key: 'grandTotal', label: 'Total', render: (item: Sale) => formatCurrency(item.grandTotal) },
    { key: 'paidAmount', label: 'Paid', render: (item: Sale) => formatCurrency(item.paidAmount) },
    { key: 'dueAmount', label: 'Due', render: (item: Sale) => <span className="text-red-500">{formatCurrency(item.dueAmount)}</span> },
    { key: 'paymentMethod', label: 'Payment' },
    { key: 'status', label: 'Status', render: (item: Sale) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'createdAt', label: 'Date', render: (item: Sale) => formatDate(item.createdAt, 'datetime') },
    { key: 'actions', label: '', render: (item: Sale) => (
      <Link href={`/sales/${item.id}`}>
        <Button variant="ghost" size="icon"><Eye size={16} /></Button>
      </Link>
    )},
  ]

  return (
    <div>
      <PageHeader title="Sales" description={`${total} transactions`}>
        <Link href="/pos"><Button><Plus size={16} /> New Sale</Button></Link>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice or customer..."
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
            { label: 'Completed', value: 'COMPLETED' },
            { label: 'Cancelled', value: 'CANCELLED' },
            { label: 'Refunded', value: 'REFUNDED' },
            { label: 'Returned', value: 'RETURNED' },
          ]}
          className="w-40"
        />
        <Select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1) }}
          options={[
            { label: 'All Branches', value: '' },
            ...branches.map((b) => ({ label: b.name, value: b.id })),
          ]}
          className="w-44"
        />
      </div>

      <DataTable columns={columns} data={sales as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
    </div>
  )
}
