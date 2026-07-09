import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      product: { companyId: user.companyId },
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
    }

    const [counts, total] = await Promise.all([
      prisma.stockCount.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          countedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { countedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.stockCount.count({ where }),
    ])

    return paginatedResponse(counts, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { items } = body

    if (!items?.length) {
      return errorResponse('Items are required')
    }

    const records = await prisma.$transaction(
      items.map((item: { productId: string; warehouseId: string; systemQty: number; physicalQty: number; difference: number; note?: string }) =>
        prisma.stockCount.create({
          data: {
            warehouseId: item.warehouseId,
            productId: item.productId,
            systemQty: item.systemQty,
            physicalQty: item.physicalQty,
            difference: item.difference,
            note: item.note,
            countedById: user.id,
          },
        })
      )
    )

    return successResponse(records, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
