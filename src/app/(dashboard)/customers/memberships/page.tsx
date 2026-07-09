'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const TIERS = ['SILVER', 'GOLD', 'DIAMOND', 'VIP']

const tierColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'info'> = {
  SILVER: 'secondary',
  GOLD: 'warning',
  DIAMOND: 'info',
  VIP: 'default',
}

export default function MembershipsPage() {
  interface Membership {
    id: string; tier: string; cardNo: string | null; points: number
    totalSpent: number; expiresAt: string | null; isActive: boolean
    customer: { firstName: string; lastName: string; phone: string } | null
  }
  interface Customer { id: string; firstName: string; lastName: string; phone: string }

  const [memberships, setMemberships] = useState<Membership[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [tierFilter, setTierFilter] = useState('')
  const [formData, setFormData] = useState({ customerId: '', tier: 'SILVER', cardNo: '', expiresAt: '' })

  async function loadMemberships() {
    setLoading(true)
    try {
      const url = `/api/customers/loyalty?page=${page}&limit=20${tierFilter ? `&tier=${tierFilter}` : ''}`
      const res = await fetch(url)
      if (res.ok) { const d = await res.json(); setMemberships(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers?limit=500')
      if (res.ok) { const d = await res.json(); setCustomers(d.data) }
    } catch {}
  }

  useEffect(() => { loadCustomers() }, [])
  useEffect(() => { loadMemberships() }, [page, tierFilter])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/customers/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Membership created')
      setShowForm(false)
      setFormData({ customerId: '', tier: 'SILVER', cardNo: '', expiresAt: '' })
      loadMemberships()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns: import('@/components/ui/data-table').Column[] = [
    {
      key: 'customer', label: 'Customer',
      render: (item) => `${item.customer?.firstName ?? ''} ${item.customer?.lastName ?? ''}`,
    },
    {
      key: 'tier', label: 'Tier',
      render: (item) => <Badge variant={tierColors[item.tier] ?? 'default'}>{item.tier}</Badge>,
    },
    { key: 'cardNo', label: 'Card No' },
    { key: 'points', label: 'Points' },
    { key: 'totalSpent', label: 'Total Spent', render: (item) => formatCurrency(item.totalSpent) },
    { key: 'expiresAt', label: 'Expires', render: (item) => item.expiresAt ? formatDate(item.expiresAt) : '-' },
  ]

  return (
    <div>
      <PageHeader title="Memberships" description={`${total} memberships`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Membership</Button>
      </PageHeader>

      <div className="mb-4">
        <Select
          value={tierFilter}
          onChange={(e) => { setTierFilter(e.target.value); setPage(1) }}
          options={[{ label: 'All Tiers', value: '' }, ...TIERS.map(t => ({ label: t, value: t }))]}
          className="w-40"
        />
      </div>

      <DataTable columns={columns} data={memberships} total={total} page={page} loading={loading} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Membership">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer *</label>
            <Select
              required
              value={formData.customerId}
              onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
              options={customers.map((c: Customer) => ({
                label: `${c.firstName} ${c.lastName} - ${c.phone}`,
                value: c.id,
              }))}
              placeholder="Select customer"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tier *</label>
            <Select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              options={TIERS.map(t => ({ label: t, value: t }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Card No (leave blank for auto)</label>
            <Input value={formData.cardNo} onChange={(e) => setFormData({ ...formData, cardNo: e.target.value })} placeholder="Auto-generated" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expires At</label>
            <Input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
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
