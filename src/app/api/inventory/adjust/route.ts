import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { productId, warehouseId, newQuantity, reason, note } = body

    if (!productId || !warehouseId || newQuantity === undefined) {
      return errorResponse('Product, warehouse, and quantity are required')
    }

    const stock = await prisma.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    })

    if (!stock) return errorResponse('Stock record not found', 404)

    await prisma.$transaction([
      prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      }),
      prisma.stockAdjustment.create({
        data: {
          productId,
          warehouseId,
          oldQuantity: stock.quantity,
          newQuantity,
          difference: newQuantity - stock.quantity,
          reason,
          note,
          createdById: user.id,
        },
      }),
      prisma.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type: 'ADJUSTMENT',
          quantity: newQuantity - stock.quantity,
          reference: reason,
          createdById: user.id,
        },
      }),
    ])

    return successResponse({ message: 'Stock adjusted successfully' })
  } catch (error) {
    return handleApiError(error)
  }
}
