import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      ...(isActive !== null && { isActive: isActive === 'true' }),
      ...(params.search && { code: { contains: params.search } }),
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.coupon.count({ where }),
    ])

    return paginatedResponse(coupons, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { code, type, value, minPurchase, maxDiscount, usageLimit, startsAt, expiresAt } = body

    if (!code || !type || value === undefined) {
      return errorResponse('code, type, and value are required')
    }
    if (!['percentage', 'fixed'].includes(type)) {
      return errorResponse('type must be percentage or fixed')
    }

    const existing = await prisma.coupon.findUnique({ where: { code } })
    if (existing) return errorResponse('Coupon code already exists')

    const coupon = await prisma.coupon.create({
      data: {
        companyId: user.companyId,
        code: code.toUpperCase(),
        type,
        value,
        minPurchase: minPurchase ?? 0,
        maxDiscount: maxDiscount ?? null,
        usageLimit: usageLimit ?? null,
        usedCount: 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return successResponse(coupon, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
