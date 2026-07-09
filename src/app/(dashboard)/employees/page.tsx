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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
    role: 'CASHIER', designation: '', department: '', salary: 0, joiningDate: '',
  })

  async function loadEmployees() {
    setLoading(true)
    try {
      const res = await fetch(`/api/employees?page=${page}&limit=20`)
      if (res.ok) { const d = await res.json(); setEmployees(d.data); setTotal(d.total) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadEmployees() }, [page])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Employee created')
      setShowForm(false)
      loadEmployees()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const columns = [
    { key: 'name', label: 'Employee', render: (item: { user?: { firstName: string; lastName: string; email: string } }) => (
      <div><div className="font-medium">{item.user?.firstName} {item.user?.lastName}</div><div className="text-xs text-muted-foreground">{item.user?.email}</div></div>
    )},
    { key: 'employeeCode', label: 'Code' },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'salary', label: 'Salary', render: (item: { salary: number }) => formatCurrency(item.salary) },
    { key: 'joiningDate', label: 'Joined', render: (item: { joiningDate: string }) => formatDate(item.joiningDate) },
    { key: 'user', label: 'Role', render: (item: { user?: { role: string } }) => <Badge variant="info">{item.user?.role}</Badge> },
  ]

  const roleOptions = [
    { label: 'Cashier', value: 'CASHIER' },
    { label: 'Branch Manager', value: 'BRANCH_MANAGER' },
    { label: 'Inventory Manager', value: 'INVENTORY_MANAGER' },
    { label: 'Accountant', value: 'ACCOUNTANT' },
    { label: 'HR', value: 'HR' },
    { label: 'Warehouse Manager', value: 'WAREHOUSE_MANAGER' },
    { label: 'Delivery Staff', value: 'DELIVERY_STAFF' },
  ]

  return (
    <div>
      <PageHeader title="Employees" description={`${total} employees`}>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Add Employee</Button>
      </PageHeader>
      <DataTable columns={columns} data={employees} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Employee" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">First Name *</label><Input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Last Name *</label><Input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Email *</label><Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Password *</label><Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Role</label>
              <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} options={roleOptions} />
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Department</label><Input value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><label className="text-sm font-medium">Designation</label><Input value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Salary</label><Input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Joining Date</label><Input type="date" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Create Employee</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
