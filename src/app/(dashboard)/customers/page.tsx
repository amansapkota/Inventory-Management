'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '' })

  async function loadCustomers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers?page=${page}&limit=20&search=${search}`)
      if (res.ok) { const d = await res.json(); setCustomers(d.data); setTotal(d.total) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCustomers() }, [page, search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Customer created')
      setShowForm(false)
      setFormData({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '' })
      loadCustomers()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns: import('@/components/ui/data-table').Column[] = [
    { key: 'name', label: 'Name', render: (item) => `${item.firstName} ${item.lastName}` },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'totalPurchases', label: 'Total Spent', render: (item) => formatCurrency(item.totalPurchases) },
    { key: '_count', label: 'Visits', render: (item) => item._count?.sales ?? 0 },
    { key: 'createdAt', label: 'Since', render: (item) => formatDate(item.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Customers" description={`${total} customers`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Customer</Button>
      </PageHeader>
      <DataTable columns={columns} data={customers} total={total} page={page} search={search} loading={loading} onSearch={setSearch} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Customer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">First Name *</label><Input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Last Name</label><Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Phone *</label><Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">City</label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
