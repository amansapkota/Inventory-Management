import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      product: { companyId: user.companyId, isActive: true },
      ...(params.warehouseId && { warehouseId: params.warehouseId }),
    }

    const [stock, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, sellingPrice: true, minStock: true, images: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
        orderBy: { quantity: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.stock.count({ where }),
    ])

    return paginatedResponse(stock, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}
