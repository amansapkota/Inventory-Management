import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)
    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier')
    const customerId = searchParams.get('customerId')

    const where: Record<string, unknown> = {
      customer: { companyId: user.companyId },
      ...(tier && { tier }),
      ...(customerId && { customerId }),
    }

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.membership.count({ where }),
    ])

    return paginatedResponse(memberships, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { customerId, tier, cardNo, expiresAt } = body

    if (!customerId || !tier) return errorResponse('customerId and tier are required')

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId: user.companyId },
    })
    if (!customer) return errorResponse('Customer not found', 404)

    const membershipCount = await prisma.membership.count()
    const finalCardNo = cardNo ?? `M-${String(membershipCount + 1).padStart(6, '0')}`

    const membership = await prisma.membership.upsert({
      where: { id: body.id ?? '' },
      create: {
        customerId,
        tier,
        cardNo: finalCardNo,
        points: 0,
        totalSpent: 0,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        tier,
        cardNo: finalCardNo,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    })

    return successResponse(membership, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
