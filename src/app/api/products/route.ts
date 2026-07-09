import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, errorResponse, getSearchParams, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      ...(params.search && {
        OR: [
          { name: { contains: params.search } },
          { sku: { contains: params.search } },
          { barcode: { contains: params.search } },
        ],
      }),
      ...(params.categoryId && { categoryId: params.categoryId }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          stock: {
            include: { warehouse: { select: { id: true, name: true } } },
            take: 5,
          },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.product.count({ where }),
    ])

    return paginatedResponse(products, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { name, sku, barcode, categoryId, brandId, unit, purchasePrice, sellingPrice, wholesalePrice,
      minStock, maxStock, description, trackBatch, trackExpiry, warrantyPeriod, images, taxRateId } = body

    if (!name || !sku) {
      return errorResponse('Name and SKU are required')
    }

    const existing = await prisma.product.findUnique({ where: { sku } })
    if (existing) {
      return errorResponse('Product with this SKU already exists')
    }

    const product = await prisma.product.create({
      data: {
        companyId: user.companyId,
        name, sku, barcode,
        categoryId: categoryId || null,
        brandId: brandId || null,
        unit: unit || 'pcs',
        purchasePrice: purchasePrice || 0,
        sellingPrice: sellingPrice || 0,
        wholesalePrice: wholesalePrice || null,
        minStock: minStock || 0,
        maxStock: maxStock || null,
        description,
        trackBatch: trackBatch || false,
        trackExpiry: trackExpiry || false,
        warrantyPeriod: warrantyPeriod || null,
        images: images || null,
        taxRateId: taxRateId || null,
        slug: sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      },
      include: {
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    })

    return successResponse(product, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
