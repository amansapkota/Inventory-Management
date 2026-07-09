import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { saleId, items } = body

    if (!saleId || !items?.length) return errorResponse('saleId and items are required')

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, branch: { companyId: user.companyId } },
      include: { items: true },
    })
    if (!sale) return errorResponse('Sale not found', 404)

    const returnNo = `RTN-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    let totalRefund = 0

    const returnData = await prisma.$transaction(async (tx) => {
      const returnItems = await Promise.all(
        items.map(async (item: { saleItemId: string; quantity: number; refundAmount: number; reason?: string }) => {
          const saleItem = sale.items.find((si) => si.id === item.saleItemId)
          if (!saleItem) throw new Error(`Sale item ${item.saleItemId} not found`)
          if (item.quantity > saleItem.quantity) throw new Error(`Return quantity exceeds original for item ${item.saleItemId}`)

          totalRefund += item.refundAmount

          await tx.saleItem.update({
            where: { id: item.saleItemId },
            data: { quantity: { decrement: item.quantity } },
          })

          const stockRecords = await tx.stock.findMany({
            where: { productId: saleItem.productId, warehouse: { companyId: user.companyId } },
          })

          for (const stock of stockRecords) {
            await tx.stock.update({
              where: { id: stock.id },
              data: { quantity: { increment: item.quantity } },
            })
          }

          if (stockRecords.length > 0) {
            await tx.stockMovement.create({
              data: {
                productId: saleItem.productId,
                warehouseId: stockRecords[0].warehouseId,
                type: 'RETURN',
                quantity: item.quantity,
                reference: 'Sale Return',
                referenceId: returnNo,
                createdById: user.id,
              },
            })
          }

          return {
            saleItemId: item.saleItemId,
            quantity: item.quantity,
            refundAmount: item.refundAmount,
            reason: item.reason || null,
          }
        })
      )

      const saleReturn = await tx.saleReturn.create({
        data: {
          saleId,
          returnNo,
          reason: body.reason || 'Customer return',
          status: 'completed',
          totalRefund,
          createdById: user.id,
          items: { create: returnItems },
        },
        include: { items: true, sale: { select: { invoiceNo: true } } },
      })

      return saleReturn
    })

    return successResponse(returnData, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      sale: { branch: { companyId: user.companyId } },
    }

    const [returns, total] = await Promise.all([
      prisma.saleReturn.findMany({
        where,
        include: {
          sale: { select: { id: true, invoiceNo: true, grandTotal: true, customer: { select: { firstName: true, lastName: true } } } },
          items: true,
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.saleReturn.count({ where }),
    ])

    return paginatedResponse(returns, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}
