import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      OR: [
        { fromWarehouse: { companyId: user.companyId } },
        { toWarehouse: { companyId: user.companyId } },
      ],
    }

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          fromWarehouse: { select: { id: true, name: true } },
          toWarehouse: { select: { id: true, name: true } },
          sentBy: { select: { id: true, firstName: true, lastName: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.stockTransfer.count({ where }),
    ])

    return paginatedResponse(transfers, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { fromWarehouseId, toWarehouseId, items, note } = body

    if (!fromWarehouseId || !toWarehouseId || !items?.length) {
      return errorResponse('From/To warehouse and items are required')
    }

    if (fromWarehouseId === toWarehouseId) {
      return errorResponse('Cannot transfer to the same warehouse')
    }

    const refNo = `TRF-${Date.now()}`

    const transfer = await prisma.stockTransfer.create({
      data: {
        referenceNo: refNo,
        fromWarehouseId,
        toWarehouseId,
        sentById: user.id,
        status: 'pending',
        note,
        items: {
          create: items.map((item: { productId: string; quantity: number; batchNo?: string }) => ({
            productId: item.productId,
            quantity: item.quantity,
            batchNo: item.batchNo,
          })),
        },
      },
      include: { items: true },
    })

    return successResponse(transfer, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
