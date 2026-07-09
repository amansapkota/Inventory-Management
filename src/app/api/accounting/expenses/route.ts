import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      branch: { companyId: user.companyId },
      ...(params.branchId && { branchId: params.branchId }),
      ...(params.startDate && params.endDate && {
        expenseDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
      }),
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, skip: (params.page - 1) * params.limit, take: params.limit }),
      prisma.expense.count({ where }),
    ])

    return paginatedResponse(expenses, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { category, amount, description, expenseDate } = body

    if (!category || !amount) return errorResponse('Category and amount required')

    const expense = await prisma.expense.create({
      data: {
        branchId: user.branchId ?? '',
        category, amount: parseFloat(amount), description,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        createdById: user.id,
      },
    })

    return successResponse(expense, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
