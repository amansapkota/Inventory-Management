'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Plus, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Payroll {
  id: string
  periodStart: string
  periodEnd: string
  basicSalary: number
  allowances: number
  deductions: number
  commission: number
  bonus: number
  taxDeduction: number
  netSalary: number
  paymentStatus: string
  paidAt: string | null
  employee: { employeeCode: string; department: string | null; designation: string | null }
  user: { firstName: string; lastName: string }
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; employeeCode: string; user: { firstName: string; lastName: string } }[]>([])
  const [periodFilter, setPeriodFilter] = useState({ start: '', end: '' })
  const [formData, setFormData] = useState({
    employeeId: '', periodStart: '', periodEnd: '',
    basicSalary: 0, allowances: 0, deductions: 0, commission: 0, bonus: 0, taxDeduction: 0,
  })

  async function loadPayrolls() {
    setLoading(true)
    try {
      let url = `/api/employees/payroll?page=${page}&limit=20`
      if (periodFilter.start) url += `&periodStart=${periodFilter.start}`
      if (periodFilter.end) url += `&periodEnd=${periodFilter.end}`
      const res = await fetch(url)
      if (res.ok) { const d = await res.json(); setPayrolls(d.data); setTotal(d.total) }
    } catch { toast.error('Failed to load payroll') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadPayrolls() }, [page, periodFilter])

  async function loadEmployees() {
    try {
      const res = await fetch('/api/employees?limit=100')
      if (res.ok) { const d = await res.json(); setEmployees(d.data) }
    } catch { toast.error('Failed to load employees') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/employees/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Payroll generated')
      setShowForm(false)
      setFormData({ employeeId: '', periodStart: '', periodEnd: '', basicSalary: 0, allowances: 0, deductions: 0, commission: 0, bonus: 0, taxDeduction: 0 })
      loadPayrolls()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  async function markAsPaid(id: string) {
    try {
      const res = await fetch('/api/employees/payroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Marked as paid')
      loadPayrolls()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const netSalary = formData.basicSalary + formData.allowances + formData.commission + formData.bonus - formData.deductions - formData.taxDeduction

  const columns = [
    { key: 'employee', label: 'Employee', render: (item: Payroll) => (
      <div><div className="font-medium">{item.user.firstName} {item.user.lastName}</div><div className="text-xs text-muted-foreground">{item.employee.employeeCode}</div></div>
    )},
    { key: 'period', label: 'Period', render: (item: Payroll) => `${formatDate(item.periodStart)} - ${formatDate(item.periodEnd)}` },
    { key: 'basicSalary', label: 'Basic', render: (item: Payroll) => formatCurrency(item.basicSalary) },
    { key: 'allowances', label: 'Allowances', render: (item: Payroll) => formatCurrency(item.allowances) },
    { key: 'deductions', label: 'Deductions', render: (item: Payroll) => formatCurrency(item.deductions) },
    { key: 'netSalary', label: 'Net Salary', render: (item: Payroll) => <span className="font-semibold">{formatCurrency(item.netSalary)}</span> },
    { key: 'paymentStatus', label: 'Status', render: (item: Payroll) => <Badge className={getStatusColor(item.paymentStatus)}>{item.paymentStatus}</Badge> },
    { key: 'actions', label: '', render: (item: Payroll) => item.paymentStatus === 'pending' ? (
      <Button variant="ghost" size="sm" onClick={() => markAsPaid(item.id)} className="text-green-600">
        <CheckCircle size={16} className="mr-1" /> Mark Paid
      </Button>
    ) : null },
  ]

  const employeeOptions = employees.map((e) => ({
    label: `${e.user.firstName} ${e.user.lastName} (${e.employeeCode})`,
    value: e.id,
  }))

  return (
    <div>
      <PageHeader title="Payroll Management" description={`${total} payroll records`}>
        <Button onClick={() => { setShowForm(true); loadEmployees() }}><Plus size={16} /> Generate Payroll</Button>
      </PageHeader>
      <div className="flex items-center gap-4 mb-4">
        <div className="space-y-1">
          <label className="text-xs font-medium">Period From</label>
          <Input type="date" value={periodFilter.start} onChange={(e) => setPeriodFilter({ ...periodFilter, start: e.target.value })} className="w-40" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Period To</label>
          <Input type="date" value={periodFilter.end} onChange={(e) => setPeriodFilter({ ...periodFilter, end: e.target.value })} className="w-40" />
        </div>
        {(periodFilter.start || periodFilter.end) && (
          <Button variant="outline" size="sm" className="mt-auto" onClick={() => setPeriodFilter({ start: '', end: '' })}>Clear</Button>
        )}
      </div>
      <DataTable columns={columns} data={payrolls as never[]} total={total} page={page} loading={loading} onPageChange={setPage} />
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Generate Payroll" size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee *</label>
            <Select value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} options={employeeOptions} placeholder="Select employee" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Period Start *</label>
              <Input type="date" required value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period End *</label>
              <Input type="date" required value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Basic Salary</label>
              <Input type="number" step="0.01" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Allowances</label>
              <Input type="number" step="0.01" value={formData.allowances} onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deductions</label>
              <Input type="number" step="0.01" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Commission</label>
              <Input type="number" step="0.01" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bonus</label>
              <Input type="number" step="0.01" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Deduction</label>
              <Input type="number" step="0.01" value={formData.taxDeduction} onChange={(e) => setFormData({ ...formData, taxDeduction: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="text-right text-lg font-semibold">Net Salary: {formatCurrency(netSalary)}</div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Generate Payroll</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
