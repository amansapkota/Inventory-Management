import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const [todaySales, weeklySales, monthlySales, totalProducts, totalCustomers, lowStockCount, employeeCount, totalExpenses] = await Promise.all([
      prisma.sale.aggregate({
        where: { createdAt: { gte: today }, branch: { companyId: user.companyId } },
        _sum: { grandTotal: true },
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: weekAgo }, branch: { companyId: user.companyId } },
        _sum: { grandTotal: true },
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: monthStart }, branch: { companyId: user.companyId } },
        _sum: { grandTotal: true, paidAmount: true },
      }),
      prisma.product.count({ where: { companyId: user.companyId, isActive: true } }),
      prisma.customer.count({ where: { companyId: user.companyId, isActive: true } }),
      prisma.stock.count({
        where: {
          product: { companyId: user.companyId, isActive: true },
          quantity: { lte: 10 },
        },
      }),
      prisma.employee.count({ where: { companyId: user.companyId, isActive: true } }),
      prisma.expense.aggregate({
        where: { expenseDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
    ])

    return successResponse({
      todaySales: todaySales._sum.grandTotal ?? 0,
      weeklySales: weeklySales._sum.grandTotal ?? 0,
      monthlyRevenue: monthlySales._sum.grandTotal ?? 0,
      totalExpenses: totalExpenses._sum.amount ?? 0,
      totalProfit: (monthlySales._sum.grandTotal ?? 0) - (totalExpenses._sum.amount ?? 0),
      totalOrders: await prisma.sale.count({ where: { branch: { companyId: user.companyId }, createdAt: { gte: monthStart } } }),
      pendingOrders: await prisma.sale.count({ where: { branch: { companyId: user.companyId }, status: 'PENDING' } }),
      lowStockCount,
      totalProducts,
      totalCustomers,
      totalEmployees: employeeCount,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
