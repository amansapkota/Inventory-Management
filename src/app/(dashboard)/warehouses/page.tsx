'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Warehouse as WarehouseIcon, Plus, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; code: string; address: string; city: string; type: string; isActive: boolean; branch?: { name: string } }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', address: '', city: '', type: 'storage', branchId: '' })
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])

  async function loadWarehouses() {
    setLoading(true)
    try {
      const res = await fetch('/api/warehouses')
      if (res.ok) { const d = await res.json(); setWarehouses(d.data || []) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadWarehouses()
    fetch('/api/branches').then(r => r.json()).then(d => setBranches(d.data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/warehouses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Warehouse created')
      setShowForm(false)
      loadWarehouses()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  return (
    <div>
      <PageHeader title="Warehouses" description="Manage storage locations">
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Warehouse</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => (
          <Card key={wh.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <WarehouseIcon className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{wh.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{wh.code}</p>
                  </div>
                </div>
                <Badge variant={wh.type === 'main' ? 'info' : 'secondary'}>{wh.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
              {wh.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin size={14} /> {wh.address}</div>}
              {wh.branch && <div className="text-muted-foreground mt-1">Branch: {wh.branch.name}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Warehouse">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Name *</label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Code *</label><Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">City</label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Branch</label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
              <option value="">No branch (central)</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Create Warehouse</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
