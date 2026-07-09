import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      ...(params.startDate && params.endDate && {
        date: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
      }),
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { account: { select: { id: true, name: true, code: true, type: true } } },
        orderBy: { date: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.transaction.count({ where }),
    ])

    return paginatedResponse(transactions, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { accountId, type, amount, description, reference, date } = body

    if (!accountId || !type || !amount) return errorResponse('Required fields missing')

    const transaction = await prisma.transaction.create({
      data: {
        companyId: user.companyId,
        accountId, type, amount, description, reference,
        date: date ? new Date(date) : new Date(),
      },
    })

    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { [type === 'credit' ? 'increment' : 'decrement']: amount } },
    })

    return successResponse(transaction, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
