'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

interface ReportData {
  [key: string]: unknown
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchReport = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const params = new URLSearchParams({ type: reportType })
      if (dateFrom) params.set('startDate', dateFrom)
      if (dateTo) params.set('endDate', dateTo)

      const res = await fetch(`/api/reports?${params}`, { signal: controller.signal })
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Failed to fetch report')
      }
    } finally {
      setLoading(false)
    }
  }, [reportType, dateFrom, dateTo])

  useEffect(() => {
    fetchReport()
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [fetchReport])

  function getSummaryCards() {
    if (!data) return []
    switch (reportType) {
      case 'sales':
        return [
          { label: 'Total Sales', value: formatCurrency((data.totalSales as number) || 0) },
          { label: 'Total Profit', value: formatCurrency((data.totalProfit as number) || 0) },
          { label: 'Total Orders', value: String(data.totalOrders || 0) },
          {
            label: 'Margin',
            value: data.totalSales
              ? `${(((data.totalProfit as number) / (data.totalSales as number)) * 100).toFixed(1)}%`
              : '0%',
          },
        ]
      case 'pnl':
        return [
          { label: 'Revenue', value: formatCurrency((data.totalRevenue as number) || 0) },
          { label: 'COGS', value: formatCurrency((data.totalCOGS as number) || 0) },
          { label: 'Expenses', value: formatCurrency((data.totalExpenses as number) || 0) },
          { label: 'Net Profit', value: formatCurrency((data.netProfit as number) || 0) },
        ]
      case 'inventory':
        return [
          { label: 'Total Products', value: String(data.totalProducts || 0) },
          { label: 'Stock Value', value: formatCurrency((data.totalStockValue as number) || 0) },
          { label: 'Low Stock', value: String(data.lowStockCount || 0) },
          { label: 'Out of Stock', value: String(data.outOfStockCount || 0) },
        ]
      case 'purchase':
        return [
          { label: 'Total Purchases', value: String(data.totalPurchases || 0) },
          { label: 'Pending', value: String(data.pendingCount || 0) },
          { label: 'Received', value: String(data.receivedCount || 0) },
          { label: 'Cancelled', value: String((data.cancelledCount as number) || 0) },
        ]
      case 'customer':
        return [
          { label: 'Total Customers', value: String(data.totalCustomers || 0) },
          { label: 'New Customers', value: String(data.newCustomers || 0) },
          { label: 'Sales to Customers', value: formatCurrency((data.totalSalesToCustomers as number) || 0) },
        ]
      case 'tax':
        return [
          { label: 'Tax Collected', value: formatCurrency((data.totalTaxCollected as number) || 0) },
          { label: 'Tax on Purchases', value: formatCurrency((data.totalTaxOnPurchases as number) || 0) },
          { label: 'Net Tax', value: formatCurrency((data.netTax as number) || 0) },
        ]
      default:
        return []
    }
  }

  async function exportReport(format: 'pdf' | 'excel') {
    if (!data) {
      toast.error('Generate the report first')
      return
    }
    setExporting(format)
    try {
      if (format === 'excel') {
        await exportExcel()
      } else {
        await exportPDF()
      }
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  function flattenData(): Record<string, unknown>[] {
    if (!data) return []
    const rows: Record<string, unknown>[] = []
    const summary = getSummaryCards()
    const row: Record<string, unknown> = {}
    for (const s of summary) row[s.label] = s.value
    rows.push(row)
    return rows
  }

  async function exportExcel() {
    const wb = XLSX.utils.book_new()

    const summary = getSummaryCards()
    const summaryData = summary.map((s) => ({ Metric: s.label, Value: s.value }))
    const wsSummary = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    if (reportType === 'sales' && data) {
      const daily = (data.dailySales as Array<{ date: string; sales: number; profit: number }>) || []
      if (daily.length) {
        const ws = XLSX.utils.json_to_sheet(daily)
        XLSX.utils.book_append_sheet(wb, ws, 'Daily Sales')
      }
      const cats = (data.salesByCategory as Array<{ name: string; value: number }>) || []
      if (cats.length) {
        const ws = XLSX.utils.json_to_sheet(cats)
        XLSX.utils.book_append_sheet(wb, ws, 'By Category')
      }
      const top = (data.topProducts as Array<{ name: string; quantity: number; total: number }>) || []
      if (top.length) {
        const ws = XLSX.utils.json_to_sheet(top)
        XLSX.utils.book_append_sheet(wb, ws, 'Top Products')
      }
    }

    if (reportType === 'pnl' && data) {
      const monthly = (data.monthlyBreakdown as Array<Record<string, unknown>>) || []
      if (monthly.length) {
        const ws = XLSX.utils.json_to_sheet(monthly)
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly P&L')
      }
    }

    if (reportType === 'inventory' && data) {
      const warehouse = (data.stockByWarehouse as Array<Record<string, unknown>>) || []
      if (warehouse.length) {
        const ws = XLSX.utils.json_to_sheet(warehouse)
        XLSX.utils.book_append_sheet(wb, ws, 'By Warehouse')
      }
      const expiring = (data.expiringProducts as Array<Record<string, unknown>>) || []
      if (expiring.length) {
        const ws = XLSX.utils.json_to_sheet(expiring)
        XLSX.utils.book_append_sheet(wb, ws, 'Expiring')
      }
    }

    if (reportType === 'purchase' && data) {
      const supplier = (data.bySupplier as Array<Record<string, unknown>>) || []
      if (supplier.length) {
        const ws = XLSX.utils.json_to_sheet(supplier)
        XLSX.utils.book_append_sheet(wb, ws, 'By Supplier')
      }
      const monthly = (data.monthlyTotals as Array<Record<string, unknown>>) || []
      if (monthly.length) {
        const ws = XLSX.utils.json_to_sheet(monthly)
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly')
      }
    }

    if (reportType === 'customer' && data) {
      const top = (data.topCustomers as Array<Record<string, unknown>>) || []
      if (top.length) {
        const ws = XLSX.utils.json_to_sheet(top)
        XLSX.utils.book_append_sheet(wb, ws, 'Top Customers')
      }
    }

    if (reportType === 'tax' && data) {
      const monthly = (data.monthlyBreakdown as Array<Record<string, unknown>>) || []
      if (monthly.length) {
        const ws = XLSX.utils.json_to_sheet(monthly)
        XLSX.utils.book_append_sheet(wb, ws, 'Monthly Tax')
      }
    }

    XLSX.writeFile(wb, `${reportType}-report.xlsx`)
    toast.success('Excel report downloaded')
  }

  async function exportPDF() {
    const doc = new jsPDF()
    const title = `${reportType.toUpperCase()} Report`
    doc.setFontSize(18)
    doc.text(title, 14, 22)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)
    if (dateFrom && dateTo) {
      doc.text(`Period: ${dateFrom} to ${dateTo}`, 14, 36)
    }

    const summary = getSummaryCards()
    const summaryRows = summary.map((s) => [s.label, s.value])
    autoTable(doc, {
      startY: 42,
      head: [['Metric', 'Value']],
      body: summaryRows,
      styles: { fontSize: 10 },
    })

    let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

    if (reportType === 'sales' && data) {
      const daily = (data.dailySales as Array<{ date: string; sales: number; profit: number }>) || []
      if (daily.length) {
        autoTable(doc, {
          startY: y,
          head: [['Date', 'Sales', 'Profit']],
          body: daily.map((d) => [d.date, formatCurrency(d.sales), formatCurrency(d.profit)]),
          styles: { fontSize: 8 },
        })
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      }

      const top = (data.topProducts as Array<{ name: string; quantity: number; total: number }>) || []
      if (top.length) {
        if (y > 250) { doc.addPage(); y = 20 }
        autoTable(doc, {
          startY: y,
          head: [['Product', 'Qty', 'Revenue']],
          body: top.map((p) => [p.name, String(p.quantity), formatCurrency(p.total)]),
          styles: { fontSize: 8 },
        })
      }
    }

    if (reportType === 'pnl' && data) {
      const monthly = (data.monthlyBreakdown as Array<Record<string, string | number>>) || []
      if (monthly.length) {
        autoTable(doc, {
          startY: y,
          head: [['Month', 'Revenue', 'COGS', 'Expenses', 'Gross', 'Net']],
          body: monthly.map((m) => [
            String(m.month ?? ''),
            formatCurrency(Number(m.revenue ?? 0)),
            formatCurrency(Number(m.cogs ?? 0)),
            formatCurrency(Number(m.expenses ?? 0)),
            formatCurrency(Number(m.grossProfit ?? 0)),
            formatCurrency(Number(m.netProfit ?? 0)),
          ]),
          styles: { fontSize: 7 },
        })
      }
    }

    if (reportType === 'customer' && data) {
      const top = (data.topCustomers as Array<{ name: string; totalSpent: number; orderCount: number }>) || []
      if (top.length) {
        autoTable(doc, {
          startY: y,
          head: [['Customer', 'Spent', 'Orders']],
          body: top.map((c) => [c.name, formatCurrency(c.totalSpent), String(c.orderCount)]),
          styles: { fontSize: 8 },
        })
      }
    }

    if (reportType === 'tax' && data) {
      const monthly = (data.monthlyBreakdown as Array<Record<string, string | number>>) || []
      if (monthly.length) {
        autoTable(doc, {
          startY: y,
          head: [['Month', 'Sales Tax', 'Purchase Tax']],
          body: monthly.map((m) => [
            String(m.month ?? ''),
            formatCurrency(Number(m.salesTax ?? 0)),
            formatCurrency(Number(m.purchaseTax ?? 0)),
          ]),
          styles: { fontSize: 8 },
        })
      }
    }

    doc.save(`${reportType}-report.pdf`)
    toast.success('PDF report downloaded')
  }

  const summaryCards = getSummaryCards()

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" description="Business insights and data export">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportReport('excel')} disabled={!data || exporting !== null}>
            {exporting === 'excel' ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport('pdf')} disabled={!data || exporting !== null}>
            {exporting === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            PDF
          </Button>
        </div>
      </PageHeader>

      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={reportType} onChange={(e) => setReportType(e.target.value)} options={[
            { label: 'Sales Report', value: 'sales' },
            { label: 'Profit & Loss', value: 'pnl' },
            { label: 'Inventory Report', value: 'inventory' },
            { label: 'Purchase Report', value: 'purchase' },
            { label: 'Customer Report', value: 'customer' },
            { label: 'Tax Report', value: 'tax' },
          ]} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={fetchReport} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Generate
        </Button>
      </div>

      {summaryCards.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summaryCards.map((item) => (
                <div key={item.label} className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-bold mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {reportType === 'sales' && data && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Daily Sales Trend</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={(data.dailySales as Array<{ date: string; sales: number; profit: number }>) || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                        <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} name="Profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Sales by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(data.salesByCategory as Array<{ name: string; value: number }>) || []}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label
                        >
                          {((data.salesByCategory as Array<{ name: string; value: number }>) || []).map((_: unknown, idx: number) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {((data.salesByCategory as Array<{ name: string; value: number }>) || []).map((item, idx) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                        <span>{item.name}</span>
                        <span className="ml-auto font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Payment Methods</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data.salesByPaymentMethod as Array<{ method: string; value: number }>) || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="method" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" name="Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Selling Products</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={(data.topProducts as Array<{ name: string; quantity: number; total: number }>) || []}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#22c55e" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'pnl' && data && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Monthly Profit & Loss</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data.monthlyBreakdown as Array<Record<string, unknown>>) || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                      <Bar dataKey="cogs" fill="#f59e0b" name="COGS" />
                      <Bar dataKey="netProfit" fill="#22c55e" name="Net Profit" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'inventory' && data && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Stock by Warehouse</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data.stockByWarehouse as Array<{ warehouse: string; quantity: number; value: number }>) || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="warehouse" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#3b82f6" name="Quantity" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Expiring Products (30 days)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-2 font-medium">Product</th>
                          <th className="pb-2 font-medium">Batch</th>
                          <th className="pb-2 font-medium">Qty</th>
                          <th className="pb-2 font-medium">Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((data.expiringProducts as Array<{ product: string; batchNo: string; quantity: number; expDate: string }>) || []).map((item, idx) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-2">{item.product}</td>
                            <td className="py-2">{item.batchNo}</td>
                            <td className="py-2">{item.quantity}</td>
                            <td className="py-2">{item.expDate.slice(0, 10)}</td>
                          </tr>
                        ))}
                        {(!data.expiringProducts || (data.expiringProducts as Array<unknown>).length === 0) && (
                          <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No expiring products</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'purchase' && data && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Monthly Purchase Totals</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(data.monthlyTotals as Array<{ month: string; total: number }>) || []}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" fill="#f59e0b" name="Total" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Purchases by Supplier</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(data.bySupplier as Array<{ name: string; count: number; total: number }>) || []}
                          cx="50%" cy="50%" outerRadius={100} dataKey="total" label
                        >
                          {((data.bySupplier as Array<{ name: string; total: number }>) || []).map((_: unknown, idx: number) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {reportType === 'customer' && data && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Top Customers</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Total Spent</th>
                        <th className="pb-2 font-medium">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((data.topCustomers as Array<{ name: string; totalSpent: number; orderCount: number }>) || []).map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2">{item.name}</td>
                          <td className="py-2 font-medium">{formatCurrency(item.totalSpent)}</td>
                          <td className="py-2">{item.orderCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportType === 'tax' && data && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Monthly Tax Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={(data.monthlyBreakdown as Array<{ month: string; salesTax: number; purchaseTax: number }>) || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="salesTax" fill="#3b82f6" name="Sales Tax" />
                      <Bar dataKey="purchaseTax" fill="#f59e0b" name="Purchase Tax" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
