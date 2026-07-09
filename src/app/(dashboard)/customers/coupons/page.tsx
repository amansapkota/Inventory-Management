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

export default function CouponsPage() {
  interface Coupon {
    id: string; code: string; type: string; value: number; minPurchase: number
    maxDiscount: number | null; usageLimit: number | null; usedCount: number
    isActive: boolean; startsAt: string | null; expiresAt: string | null
    createdAt: string
  }

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '', type: 'percentage', value: '', minPurchase: '0', maxDiscount: '', usageLimit: '', startsAt: '', expiresAt: '',
  })

  async function loadCoupons() {
    setLoading(true)
    try {
      const res = await fetch(`/api/customers/coupons?page=${page}&limit=20&search=${search}`)
      if (res.ok) { const d = await res.json(); setCoupons(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadCoupons() }, [page, search])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/customers/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value),
          minPurchase: parseFloat(formData.minPurchase),
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Coupon created')
      setShowForm(false)
      setFormData({ code: '', type: 'percentage', value: '', minPurchase: '0', maxDiscount: '', usageLimit: '', startsAt: '', expiresAt: '' })
      loadCoupons()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  function isActive(coupon: Coupon): boolean {
    const now = new Date()
    if (!coupon.isActive) return false
    if (coupon.startsAt && new Date(coupon.startsAt) > now) return false
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return false
    return true
  }

  const columns: import('@/components/ui/data-table').Column[] = [
    { key: 'code', label: 'Code', render: (item) => <span className="font-mono font-bold">{item.code}</span> },
    { key: 'type', label: 'Type', render: (item) => <Badge variant="secondary">{item.type}</Badge> },
    {
      key: 'value', label: 'Value',
      render: (item) => item.type === 'percentage' ? `${item.value}%` : formatCurrency(item.value),
    },
    { key: 'usedCount', label: 'Used', render: (item) => `${item.usedCount}${item.usageLimit ? ` / ${item.usageLimit}` : ''}` },
    {
      key: 'isActive', label: 'Status',
      render: (item) => <Badge variant={isActive(item) ? 'success' : 'destructive'}>{isActive(item) ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'expiresAt', label: 'Expiry', render: (item) => item.expiresAt ? formatDate(item.expiresAt) : '-' },
  ]

  return (
    <div>
      <PageHeader title="Coupons" description={`${total} coupons`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> New Coupon</Button>
      </PageHeader>

      <DataTable columns={columns} data={coupons} total={total} page={page} search={search} loading={loading} onSearch={setSearch} onPageChange={setPage} />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Coupon">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Code *</label>
              <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="SAVE20" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type *</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[{ label: 'Percentage', value: 'percentage' }, { label: 'Fixed', value: 'fixed' }]}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Value *</label>
              <Input required type="number" step="0.01" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Purchase</label>
              <Input type="number" step="0.01" value={formData.minPurchase} onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Discount</label>
              <Input type="number" step="0.01" value={formData.maxDiscount} onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usage Limit</label>
              <Input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Starts At</label>
              <Input type="datetime-local" value={formData.startsAt} onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Expires At</label>
              <Input type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
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
