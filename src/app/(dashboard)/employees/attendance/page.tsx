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
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Attendance {
  id: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: string
  note: string | null
  employee: { employeeCode: string; department: string | null }
  user: { firstName: string; lastName: string }
}

interface EmployeeOption {
  id: string
  employeeCode: string
  user: { firstName: string; lastName: string }
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [filters, setFilters] = useState({ startDate: '', endDate: '' })
  const [formData, setFormData] = useState({
    employeeId: '', date: '', clockIn: '', clockOut: '', status: 'PRESENT', note: '',
  })

  async function loadAttendance() {
    setLoading(true)
    try {
      let url = `/api/employees/attendance?page=${page}&limit=20`
      if (filters.startDate) url += `&startDate=${filters.startDate}`
      if (filters.endDate) url += `&endDate=${filters.endDate}`
      const res = await fetch(url)
      if (res.ok) { const d = await res.json(); setRecords(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadAttendance() }, [page, filters])

  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees?limit=100')
      if (res.ok) { const d = await res.json(); setEmployees(d.data) }
    } catch { toast.error('Failed to load employees') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Attendance saved')
      setShowForm(false)
      setFormData({ employeeId: '', date: '', clockIn: '', clockOut: '', status: 'PRESENT', note: '' })
      loadAttendance()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'employee', label: 'Employee', render: (item: Attendance) => (
      <div><div className="font-medium">{item.user.firstName} {item.user.lastName}</div><div className="text-xs text-muted-foreground">{item.employee.employeeCode}</div></div>
    )},
    { key: 'date', label: 'Date', render: (item: Attendance) => formatDate(item.date) },
    { key: 'clockIn', label: 'Clock In', render: (item: Attendance) => item.clockIn ? formatDate(item.clockIn, 'datetime') : '-' },
    { key: 'clockOut', label: 'Clock Out', render: (item: Attendance) => item.clockOut ? formatDate(item.clockOut, 'datetime') : '-' },
    { key: 'status', label: 'Status', render: (item: Attendance) => <Badge className={getStatusColor(item.status)}>{item.status}</Badge> },
    { key: 'note', label: 'Note', render: (item: Attendance) => item.note || '-' },
  ]

  const employeeOptions = employees.map((e) => ({
    label: `${e.user.firstName} ${e.user.lastName} (${e.employeeCode})`,
    value: e.id,
  }))

  const statusOptions = [
    { label: 'Present', value: 'PRESENT' },
    { label: 'Absent', value: 'ABSENT' },
    { label: 'Late', value: 'LATE' },
    { label: 'Half Day', value: 'HALF_DAY' },
  ]

  return (
    <div>
      <PageHeader title="Attendance" description={`${total} records`}>
        <Button onClick={() => { setShowForm(true); loadEmployees() }}><Plus size={16} /> Mark Attendance</Button>
      </PageHeader>
      <div className="flex items-center gap-4 mb-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">From</label>
          <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">To</label>
          <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="w-40" />
        </div>
        {(filters.startDate || filters.endDate) && (
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => setFilters({ startDate: '', endDate: '' })}>Clear</Button>
        )}
      </div>
      <DataTable columns={columns} data={records as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Mark Attendance" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee *</label>
            <Select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} options={employeeOptions} placeholder="Select employee" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Clock In</label>
              <Input type="datetime-local" value={formData.clockIn} onChange={(e) => setFormData({ ...formData, clockIn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clock Out</label>
              <Input type="datetime-local" value={formData.clockOut} onChange={(e) => setFormData({ ...formData, clockOut: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status *</label>
            <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} options={statusOptions} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Note</label>
            <Input value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Optional note" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save Attendance</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
