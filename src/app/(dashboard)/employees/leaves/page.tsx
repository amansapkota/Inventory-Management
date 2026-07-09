'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusColor } from '@/lib/utils'
import { Plus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Leave {
  id: string
  type: string
  startDate: string
  endDate: string
  totalDays: number
  reason: string
  status: string
  note: string | null
  employee: { employeeCode: string; department: string | null }
  user: { firstName: string; lastName: string }
  approvedBy: { firstName: string; lastName: string } | null
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; employeeCode: string; user: { firstName: string; lastName: string } }[]>([])
  const [formData, setFormData] = useState({
    employeeId: '', type: 'annual', startDate: '', endDate: '', reason: '',
  })

  async function loadLeaves() {
    setLoading(true)
    try {
      let url = `/api/employees/leaves?page=${page}&limit=20`
      if (statusFilter) url += `&status=${statusFilter}`
      const res = await fetch(url)
      if (res.ok) { const d = await res.json(); setLeaves(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load leaves') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadLeaves() }, [page, statusFilter])

  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees?limit=100')
      if (res.ok) { const d = await res.json(); setEmployees(d.data) }
    } catch { toast.error('Failed to load employees') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Leave request submitted')
      setShowForm(false)
      setFormData({ employeeId: '', type: 'annual', startDate: '', endDate: '', reason: '' })
      loadLeaves()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  async function updateLeaveStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/employees/leaves/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success(`Leave ${status.toLowerCase()}`)
      loadLeaves()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'employee', label: 'Employee', render: (item: Leave) => (
      <div><div className="font-medium">{item.user.firstName} {item.user.lastName}</div><div className="text-xs text-muted-foreground">{item.employee.employeeCode}</div></div>
    )},
    { key: 'type', label: 'Type', render: (item: Leave) => <Badge variant="info">{item.type}</Badge> },
    { key: 'dates', label: 'Dates', render: (item: Leave) => `${formatDate(item.startDate)} - ${formatDate(item.endDate)}` },
    { key: 'totalDays', label: 'Days' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status', render: (item: Leave) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'approvedBy', label: 'Approved By', render: (item: Leave) => item.approvedBy ? `${item.approvedBy.firstName} ${item.approvedBy.lastName}` : '-' },
    { key: 'actions', label: '', render: (item: Leave) => item.status === 'PENDING' ? (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => updateLeaveStatus(item.id, 'APPROVED')} className="text-green-600"><Check size={16} /></Button>
        <Button variant="ghost" size="icon" onClick={() => updateLeaveStatus(item.id, 'REJECTED')} className="text-red-600"><X size={16} /></Button>
      </div>
    ) : null },
  ]

  const employeeOptions = employees.map((e) => ({
    label: `${e.user.firstName} ${e.user.lastName} (${e.employeeCode})`,
    value: e.id,
  }))

  const typeOptions = [
    { label: 'Annual', value: 'annual' },
    { label: 'Sick', value: 'sick' },
    { label: 'Personal', value: 'personal' },
    { label: 'Other', value: 'other' },
  ]

  const filterStatusOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div>
      <PageHeader title="Leave Management" description={`${total} leave requests`}>
        <Button onClick={() => { setShowForm(true); loadEmployees() }}><Plus size={16} /> Apply Leave</Button>
      </PageHeader>
      <div className="mb-4">
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} options={filterStatusOptions} className="w-40" />
      </div>
      <DataTable columns={columns} data={leaves as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Apply Leave" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee *</label>
            <Select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} options={employeeOptions} placeholder="Select employee" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Leave Type *</label>
            <Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} options={typeOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date *</label>
              <Input type="date" required value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date *</label>
              <Input type="date" required value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Input required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason for leave" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Submit Leave</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
