'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AccountingPage() {
  const [transactions, setTransactions] = useState<never[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showExpense, setShowExpense] = useState(false)
  const [expenseData, setExpenseData] = useState({ category: '', amount: 0, description: '', expenseDate: '' })
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; code: string; type: string; balance: number }>>([])

  useEffect(() => {
    loadTransactions()
    fetch('/api/accounting/accounts').then(r => r.json()).then(d => setAccounts(d.data || []))
  }, [page])

  async function loadTransactions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounting/transactions?page=${page}&limit=20`)
      if (res.ok) { const d = await res.json(); setTransactions(d.data); setTotal(d.total) }
    } catch { toast.error('Failed') }
    finally { setLoading(false) }
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await fetch('/api/accounting/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(expenseData) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast.success('Expense recorded')
      setShowExpense(false)
      setExpenseData({ category: '', amount: 0, description: '', expenseDate: '' })
      loadTransactions()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
  }

  const totalIncome = accounts.filter(a => a.type === 'income').reduce((s, a) => s + a.balance, 0)
  const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((s, a) => s + a.balance, 0)

  const columns: { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[] = [
    { key: 'date', label: 'Date', render: (item: Record<string, unknown>) => formatDate(item.date as string) },
    { key: 'account', label: 'Account', render: (item: Record<string, unknown>) => {
      const acc = item.account as { name?: string; code?: string } | undefined
      return acc ? `${acc.code} - ${acc.name}` : '-'
    }},
    { key: 'type', label: 'Type', render: (item: Record<string, unknown>) => <span className={item.type === 'credit' ? 'text-green-500' : 'text-red-500'}>{item.type as string}</span> },
    { key: 'amount', label: 'Amount', render: (item: Record<string, unknown>) => formatCurrency(item.amount as number) },
    { key: 'description', label: 'Description' },
  ]

  const expenseCategories = [
    { label: 'Rent', value: 'Rent' }, { label: 'Utilities', value: 'Utilities' },
    { label: 'Salary', value: 'Salary' }, { label: 'Transportation', value: 'Transportation' },
    { label: 'Maintenance', value: 'Maintenance' }, { label: 'Marketing', value: 'Marketing' },
    { label: 'Office Supplies', value: 'Office Supplies' }, { label: 'Other', value: 'Other' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Accounting" description="Financial management">
        <Button onClick={() => setShowExpense(true)}><Plus size={16} /> Add Expense</Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wallet className="text-blue-500" size={18} /> Total Accounts</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{accounts.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="text-green-500" size={18} /> Total Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="text-red-500" size={18} /> Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={transactions} total={total} page={page} loading={loading} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Record Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium">Category *</label>
            <Select value={expenseData.category} onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })} options={expenseCategories} placeholder="Select category" />
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Amount *</label>
            <Input type="number" step="0.01" required value={expenseData.amount} onChange={(e) => setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Description</label>
            <Input value={expenseData.description} onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })} />
          </div>
          <div className="space-y-2"><label className="text-sm font-medium">Date</label>
            <Input type="date" value={expenseData.expenseDate} onChange={(e) => setExpenseData({ ...expenseData, expenseDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowExpense(false)}>Cancel</Button>
            <Button type="submit">Save Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
