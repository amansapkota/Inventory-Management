'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', panNo: '' })

  async function loadSuppliers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/suppliers?page=${page}&limit=20&search=${search}`)
      if (res.ok) { const d = await res.json(); setSuppliers(d.data); setTotal(d.total) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSuppliers() }, [page, search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Supplier created')
      setShowForm(false); setFormData({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', panNo: '' })
      loadSuppliers()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'contactPerson', label: 'Contact' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'totalPurchases', label: 'Total', render: (item: { totalPurchases: number }) => formatCurrency(item.totalPurchases) },
    { key: '_count', label: 'Orders', render: (item: { _count?: { purchases: number } }) => item._count?.purchases ?? 0 },
    { key: 'createdAt', label: 'Since', render: (item: { createdAt: string }) => formatDate(item.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Suppliers" description={`${total} suppliers`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Supplier</Button>
      </PageHeader>
      <DataTable columns={columns} data={suppliers} total={total} page={page} search={search} loading={loading} onSearch={setSearch} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Supplier">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium">Company Name *</label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Contact Person</label><Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Phone *</label><Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">City</label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">PAN No</label><Input value={formData.panNo} onChange={(e) => setFormData({ ...formData, panNo: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
