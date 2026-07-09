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

    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where,
        include: {
          purchase: { select: { id: true, purchaseOrderNo: true } },
          items: true,
        },
        orderBy: { receivedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.goodsReceipt.count({ where }),
    ])

    return paginatedResponse(receipts, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { purchaseId, warehouseId, items, notes } = body

    if (!purchaseId || !warehouseId || !items?.length) {
      return errorResponse('Purchase, warehouse, and items are required')
    }

    const receiptNo = `GR-${Date.now()}`

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { items: true },
    })

    if (!purchase) return errorResponse('Purchase not found', 404)

    const results = await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.create({
        data: {
          purchaseId,
          receiptNo,
          warehouseId,
          receivedById: user.id,
          notes,
          items: {
            create: items.map((item: { purchaseItemId: string; quantity: number; batchNo?: string; expDate?: string }) => ({
              purchaseItemId: item.purchaseItemId,
              quantity: item.quantity,
              batchNo: item.batchNo,
              expDate: item.expDate ? new Date(item.expDate) : null,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of items) {
        await tx.purchaseItem.update({
          where: { id: item.purchaseItemId },
          data: { receivedQty: { increment: item.quantity } },
        })

        const pi = purchase.items.find(i => i.id === item.purchaseItemId)
        if (!pi) continue

        await tx.stockMovement.create({
          data: {
            productId: pi.productId,
            warehouseId,
            type: 'IN',
            quantity: item.quantity,
            reference: receiptNo,
            referenceId: receipt.id,
            createdById: user.id,
          },
        })

        const existing = await tx.stock.findUnique({
          where: { productId_warehouseId: { productId: pi.productId, warehouseId } },
        })

        if (existing) {
          await tx.stock.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } },
          })
        } else {
          await tx.stock.create({
            data: { productId: pi.productId, warehouseId, quantity: item.quantity },
          })
        }

        if (item.batchNo) {
          const existingBatch = await tx.batchStock.findUnique({
            where: { productId_warehouseId_batchNo: { productId: pi.productId, warehouseId, batchNo: item.batchNo } },
          })
          if (existingBatch) {
            await tx.batchStock.update({
              where: { id: existingBatch.id },
              data: { quantity: { increment: item.quantity } },
            })
          } else {
            await tx.batchStock.create({
              data: {
                productId: pi.productId,
                warehouseId,
                batchNo: item.batchNo,
                quantity: item.quantity,
                purchasePrice: pi.unitPrice,
                sellingPrice: 0,
                expDate: item.expDate ? new Date(item.expDate) : null,
              },
            })
          }
        }
      }

      const allItems = await tx.purchaseItem.findMany({ where: { purchaseId } })
      const allReceived = allItems.every(i => i.receivedQty >= i.quantity)
      const anyReceived = allItems.some(i => i.receivedQty > 0)

      const newStatus = allReceived ? 'RECEIVED' : anyReceived ? 'PARTIALLY_RECEIVED' : 'ORDERED'

      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: newStatus, receivedDate: new Date() },
      })

      return receipt
    })

    return successResponse(results, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
