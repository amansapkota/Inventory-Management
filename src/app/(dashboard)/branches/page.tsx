'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Store, Plus, MapPin, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

interface Branch {
  id: string
  name: string
  code: string
  email: string
  phone: string
  address: string
  city: string
  isActive: boolean
  _count?: { users: number; sales: number; warehouses: number }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', code: '', email: '', phone: '', address: '', city: '' })

  async function loadBranches() {
    setLoading(true)
    try {
      const res = await fetch('/api/branches')
      if (res.ok) { const d = await res.json(); setBranches(d.data || []) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadBranches() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/branches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Branch created')
      setShowForm(false)
      setFormData({ name: '', code: '', email: '', phone: '', address: '', city: '' })
      loadBranches()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  return (
    <div>
      <PageHeader title="Branches" description="Manage your business locations">
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Branch</Button>
      </PageHeader>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Store className="text-primary" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{branch.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Code: {branch.code}</p>
                    </div>
                  </div>
                  <Badge variant={branch.isActive ? 'success' : 'secondary'}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {branch.address && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} /> {branch.address}{branch.city ? `, ${branch.city}` : ''}
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} /> {branch.phone}
                  </div>
                )}
                <div className="flex gap-4 pt-2 text-xs text-muted-foreground">
                  <span>Users: {0}</span>
                  <span>Sales: {0}</span>
                  <span>Warehouses: {0}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Branch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Branch Name *</label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Code *</label><Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">City</label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Create Branch</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
