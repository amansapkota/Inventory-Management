import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      purchase: { branch: { companyId: user.companyId } },
    }

    const [returns, total] = await Promise.all([
      prisma.purchaseReturn.findMany({
        where,
        include: {
          purchase: { select: { id: true, purchaseOrderNo: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.purchaseReturn.count({ where }),
    ])

    return paginatedResponse(returns, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { purchaseId, warehouseId, reason, items } = body

    if (!purchaseId || !warehouseId || !items?.length) {
      return errorResponse('Purchase, warehouse, and items are required')
    }

    const returnNo = `PR-${Date.now()}`

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: { include: { product: true } } },
    })

    if (!purchase) return errorResponse('Purchase not found', 404)

    const results = await prisma.$transaction(async (tx) => {
      let totalRefund = 0

      const returnRecord = await tx.purchaseReturn.create({
        data: {
          purchaseId,
          returnNo,
          reason,
          status: 'completed',
          createdById: user.id,
          items: {
            create: items.map((item: { purchaseItemId: string; quantity: number; reason?: string }) => {
              const pi = purchase.items.find(i => i.id === item.purchaseItemId)
              const refundAmount = pi ? item.quantity * pi.unitPrice : 0
              totalRefund += refundAmount
              return {
                purchaseItemId: item.purchaseItemId,
                quantity: item.quantity,
                refundAmount,
                reason: item.reason,
              }
            }),
          },
        },
        include: { items: true },
      })

      for (const item of items) {
        const pi = purchase.items.find(i => i.id === item.purchaseItemId)
        if (!pi) continue

        await tx.purchaseItem.update({
          where: { id: item.purchaseItemId },
          data: { receivedQty: { decrement: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            productId: pi.productId,
            warehouseId,
            type: 'RETURN',
            quantity: -item.quantity,
            reference: returnNo,
            referenceId: returnRecord.id,
            createdById: user.id,
          },
        })

        const stock = await tx.stock.findUnique({
          where: { productId_warehouseId: { productId: pi.productId, warehouseId } },
        })

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }

      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          dueAmount: { increment: totalRefund },
          status: 'RETURNED',
        },
      })

      return { ...returnRecord, totalRefund }
    })

    return successResponse(results, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
