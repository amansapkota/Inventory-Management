import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        category: true,
        brand: true,
        taxRate: true,
        variants: true,
        stock: { include: { warehouse: { select: { id: true, name: true } } } },
        batchStock: { include: { warehouse: { select: { id: true, name: true } } } },
      },
    })

    if (!product) return errorResponse('Product not found', 404)
    return successResponse(product)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } })
    if (!existing) return errorResponse('Product not found', 404)

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        barcode: body.barcode,
        categoryId: body.categoryId || null,
        brandId: body.brandId || null,
        unit: body.unit,
        purchasePrice: body.purchasePrice,
        sellingPrice: body.sellingPrice,
        wholesalePrice: body.wholesalePrice,
        minStock: body.minStock,
        maxStock: body.maxStock,
        description: body.description,
        trackBatch: body.trackBatch,
        trackExpiry: body.trackExpiry,
        warrantyPeriod: body.warrantyPeriod,
        images: body.images,
        taxRateId: body.taxRateId,
        isActive: body.isActive,
      },
    })

    return successResponse(product)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const existing = await prisma.product.findFirst({ where: { id, companyId: user.companyId } })
    if (!existing) return errorResponse('Product not found', 404)

    await prisma.product.update({ where: { id }, data: { isActive: false } })
    return successResponse({ message: 'Product deactivated' })
  } catch (error) {
    return handleApiError(error)
  }
}
