import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api'

async function getSalesReport(companyId: string, startDate?: string | null, endDate?: string | null, branchId?: string | null) {
  const where: Record<string, unknown> = {
    branch: { companyId },
    status: 'COMPLETED',
  }
  if (branchId) where.branchId = branchId
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, purchasePrice: true, category: { select: { name: true } } } },
        },
      },
    },
  })

  let totalSales = 0
  let totalProfit = 0
  const dailyMap: Record<string, { sales: number; profit: number }> = {}
  const categoryMap: Record<string, number> = {}
  const paymentMap: Record<string, number> = {}
  const productMap: Record<string, { name: string; quantity: number; total: number }> = {}

  for (const sale of sales) {
    totalSales += sale.grandTotal
    const day = sale.createdAt.toISOString().slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { sales: 0, profit: 0 }
    dailyMap[day].sales += sale.grandTotal

    const method = sale.paymentMethod
    paymentMap[method] = (paymentMap[method] || 0) + sale.grandTotal

    for (const item of sale.items) {
      const cost = item.product.purchasePrice * item.quantity
      const revenue = item.unitPrice * item.quantity
      const profit = revenue - cost
      totalProfit += profit
      dailyMap[day].profit += profit

      const catName = item.product.category?.name || 'Uncategorized'
      categoryMap[catName] = (categoryMap[catName] || 0) + revenue

      if (!productMap[item.product.id]) {
        productMap[item.product.id] = { name: item.product.name, quantity: 0, total: 0 }
      }
      productMap[item.product.id].quantity += item.quantity
      productMap[item.product.id].total += revenue
    }
  }

  const dailySales = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, sales: data.sales, profit: data.profit }))

  const salesByCategory = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const salesByPaymentMethod = Object.entries(paymentMap)
    .map(([method, value]) => ({ method, value }))
    .sort((a, b) => b.value - a.value)

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return {
    totalSales,
    totalProfit,
    totalOrders: sales.length,
    dailySales,
    salesByCategory,
    salesByPaymentMethod,
    topProducts,
  }
}

async function getPnlReport(companyId: string, startDate?: string | null, endDate?: string | null, branchId?: string | null) {
  const where: Record<string, unknown> = {
    branch: { companyId },
    status: 'COMPLETED',
  }
  const expenseWhere: Record<string, unknown> = { branch: { companyId } }
  if (branchId) {
    where.branchId = branchId
    expenseWhere.branchId = branchId
  }
  if (startDate && endDate) {
    const gte = new Date(startDate)
    const lte = new Date(endDate + 'T23:59:59.999Z')
    where.createdAt = { gte, lte }
    expenseWhere.expenseDate = { gte, lte }
  }

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { purchasePrice: true } } },
        },
      },
    }),
    prisma.expense.findMany({ where: expenseWhere }),
  ])

  let totalRevenue = 0
  let totalCOGS = 0
  const monthlyMap: Record<string, { revenue: number; cogs: number; expenses: number }> = {}

  for (const sale of sales) {
    totalRevenue += sale.grandTotal
    const monthKey = sale.createdAt.toISOString().slice(0, 7)
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, cogs: 0, expenses: 0 }
    monthlyMap[monthKey].revenue += sale.grandTotal

    for (const item of sale.items) {
      const cost = item.product.purchasePrice * item.quantity
      totalCOGS += cost
      monthlyMap[monthKey].cogs += cost
    }
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  for (const expense of expenses) {
    const monthKey = expense.expenseDate.toISOString().slice(0, 7)
    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { revenue: 0, cogs: 0, expenses: 0 }
    monthlyMap[monthKey].expenses += expense.amount
  }

  const months = Object.keys(monthlyMap).sort()
  const monthlyBreakdown = months.map((month) => {
    const d = monthlyMap[month]
    return {
      month,
      revenue: d.revenue,
      cogs: d.cogs,
      expenses: d.expenses,
      grossProfit: d.revenue - d.cogs,
      netProfit: d.revenue - d.cogs - d.expenses,
    }
  })

  return {
    totalRevenue,
    totalCOGS,
    totalExpenses,
    grossProfit: totalRevenue - totalCOGS,
    netProfit: totalRevenue - totalCOGS - totalExpenses,
    monthlyBreakdown,
  }
}

async function getInventoryReport(companyId: string) {
  const [totalProducts, stocks, batchStocks, warehouses] = await Promise.all([
    prisma.product.count({ where: { companyId, isActive: true } }),
    prisma.stock.findMany({
      where: { product: { companyId, isActive: true } },
      include: { product: { select: { purchasePrice: true, minStock: true } }, warehouse: { select: { id: true, name: true } } },
    }),
    prisma.batchStock.findMany({
      where: {
        product: { companyId },
        expDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
    }),
    prisma.warehouse.findMany({ where: { companyId, isActive: true } }),
  ])

  let totalStockValue = 0
  let lowStockCount = 0
  let outOfStockCount = 0
  const warehouseMap: Record<string, { warehouse: string; quantity: number; value: number }> = {}

  for (const warehouse of warehouses) {
    warehouseMap[warehouse.id] = { warehouse: warehouse.name, quantity: 0, value: 0 }
  }

  for (const s of stocks) {
    const value = s.quantity * s.product.purchasePrice
    totalStockValue += value
    if (s.quantity <= (s.product.minStock || 0)) lowStockCount++
    if (s.quantity === 0) outOfStockCount++
    if (warehouseMap[s.warehouse.id]) {
      warehouseMap[s.warehouse.id].quantity += s.quantity
      warehouseMap[s.warehouse.id].value += value
    }
  }

  const stockByWarehouse = Object.values(warehouseMap).filter((w) => w.quantity > 0)
  const expiringProducts = batchStocks.map((b) => ({
    product: b.product.name,
    sku: b.product.sku,
    batchNo: b.batchNo,
    quantity: b.quantity,
    expDate: b.expDate?.toISOString() || '',
  }))

  return {
    totalProducts,
    totalStockValue,
    lowStockCount,
    outOfStockCount,
    stockByWarehouse,
    expiringProducts,
  }
}

async function getPurchaseReport(companyId: string, startDate?: string | null, endDate?: string | null, branchId?: string | null) {
  const where: Record<string, unknown> = {
    branch: { companyId },
  }
  if (branchId) where.branchId = branchId
  if (startDate && endDate) {
    where.createdAt = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') }
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { supplier: { select: { id: true, name: true } } },
  })

  const totalPurchases = purchases.length
  let pendingCount = 0
  let receivedCount = 0
  const supplierMap: Record<string, { name: string; count: number; total: number }> = {}
  const monthlyMap: Record<string, number> = {}

  for (const p of purchases) {
    if (p.status === 'PENDING' || p.status === 'ORDERED') pendingCount++
    if (p.status === 'RECEIVED') receivedCount++

    if (p.supplier) {
      if (!supplierMap[p.supplier.id]) {
        supplierMap[p.supplier.id] = { name: p.supplier.name, count: 0, total: 0 }
      }
      supplierMap[p.supplier.id].count++
      supplierMap[p.supplier.id].total += p.grandTotal
    }

    const monthKey = p.createdAt.toISOString().slice(0, 7)
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + p.grandTotal
  }

  const monthlyTotals = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))

  return {
    totalPurchases,
    pendingCount,
    receivedCount,
    cancelledCount: purchases.filter((p) => p.status === 'CANCELLED').length,
    bySupplier: Object.values(supplierMap).sort((a, b) => b.total - a.total),
    monthlyTotals,
  }
}

async function getCustomerReport(companyId: string, startDate?: string | null, endDate?: string | null) {
  const where: Record<string, unknown> = { companyId }
  const newCustomerWhere: Record<string, unknown> = { companyId }
  if (startDate && endDate) {
    const range = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') }
    where.createdAt = range
    newCustomerWhere.createdAt = range
  }

  const [totalCustomers, newCustomers, sales] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.count({ where: newCustomerWhere }),
    prisma.sale.findMany({
      where: {
        branch: { companyId },
        customerId: { not: null },
        ...(startDate && endDate ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') } } : {}),
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ])

  let totalSalesToCustomers = 0
  const customerMap: Record<string, { name: string; totalSpent: number; orderCount: number }> = {}

  for (const sale of sales) {
    totalSalesToCustomers += sale.grandTotal
    if (sale.customer) {
      const cid = sale.customer.id
      if (!customerMap[cid]) {
        customerMap[cid] = { name: `${sale.customer.firstName} ${sale.customer.lastName}`, totalSpent: 0, orderCount: 0 }
      }
      customerMap[cid].totalSpent += sale.grandTotal
      customerMap[cid].orderCount++
    }
  }

  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)

  return {
    totalCustomers,
    newCustomers,
    totalSalesToCustomers,
    topCustomers,
  }
}

async function getTaxReport(companyId: string, startDate?: string | null, endDate?: string | null, branchId?: string | null) {
  const saleWhere: Record<string, unknown> = { branch: { companyId }, status: 'COMPLETED' }
  const purchaseWhere: Record<string, unknown> = { branch: { companyId } }
  if (branchId) {
    saleWhere.branchId = branchId
    purchaseWhere.branchId = branchId
  }
  if (startDate && endDate) {
    const range = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') }
    saleWhere.createdAt = range
    purchaseWhere.createdAt = range
  }

  const [sales, purchases] = await Promise.all([
    prisma.sale.findMany({ where: saleWhere, select: { createdAt: true, taxTotal: true } }),
    prisma.purchase.findMany({ where: purchaseWhere, select: { createdAt: true, taxTotal: true } }),
  ])

  const totalTaxCollected = sales.reduce((sum, s) => sum + s.taxTotal, 0)
  const totalTaxOnPurchases = purchases.reduce((sum, p) => sum + p.taxTotal, 0)

  const monthlyMap: Record<string, { salesTax: number; purchaseTax: number }> = {}

  for (const s of sales) {
    const key = s.createdAt.toISOString().slice(0, 7)
    if (!monthlyMap[key]) monthlyMap[key] = { salesTax: 0, purchaseTax: 0 }
    monthlyMap[key].salesTax += s.taxTotal
  }

  for (const p of purchases) {
    const key = p.createdAt.toISOString().slice(0, 7)
    if (!monthlyMap[key]) monthlyMap[key] = { salesTax: 0, purchaseTax: 0 }
    monthlyMap[key].purchaseTax += p.taxTotal
  }

  const monthlyBreakdown = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, salesTax: data.salesTax, purchaseTax: data.purchaseTax }))

  return {
    totalTaxCollected,
    totalTaxOnPurchases,
    netTax: totalTaxCollected - totalTaxOnPurchases,
    monthlyBreakdown,
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'sales'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const branchId = searchParams.get('branchId')

    switch (type) {
      case 'sales':
        return successResponse(await getSalesReport(user.companyId, startDate, endDate, branchId))
      case 'pnl':
        return successResponse(await getPnlReport(user.companyId, startDate, endDate, branchId))
      case 'inventory':
        return successResponse(await getInventoryReport(user.companyId))
      case 'purchase':
        return successResponse(await getPurchaseReport(user.companyId, startDate, endDate, branchId))
      case 'customer':
        return successResponse(await getCustomerReport(user.companyId, startDate, endDate))
      case 'tax':
        return successResponse(await getTaxReport(user.companyId, startDate, endDate, branchId))
      default:
        return successResponse({})
    }
  } catch (error) {
    return handleApiError(error)
  }
}
