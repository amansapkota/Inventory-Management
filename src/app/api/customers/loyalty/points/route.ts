import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      ...(customerId && { customerId }),
    }

    const [points, total] = await Promise.all([
      prisma.loyaltyPoint.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          sale: { select: { invoiceNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.loyaltyPoint.count({ where }),
    ])

    return paginatedResponse(points, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { customerId, points, type, reference } = body

    if (!customerId || !points || !type) {
      return errorResponse('customerId, points, and type are required')
    }
    if (!['earned', 'redeemed'].includes(type)) {
      return errorResponse('type must be earned or redeemed')
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId: user.companyId },
    })
    if (!customer) return errorResponse('Customer not found', 404)

    const [point] = await Promise.all([
      prisma.loyaltyPoint.create({
        data: {
          companyId: user.companyId,
          customerId,
          points: type === 'redeemed' ? -Math.abs(points) : Math.abs(points),
          type,
          reference: reference ?? null,
        },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.membership.updateMany({
        where: { customerId, isActive: true },
        data: {
          points: type === 'redeemed'
            ? { decrement: Math.abs(points) }
            : { increment: Math.abs(points) },
        },
      }),
    ])

    return successResponse(point, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
