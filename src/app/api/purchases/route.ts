import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      branch: { companyId: user.companyId },
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { purchaseOrderNo: { contains: params.search } },
          { supplier: { name: { contains: params.search } } },
        ],
      }),
      ...(params.startDate && params.endDate && {
        orderDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
      }),
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          supplier: { select: { id: true, name: true, phone: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.purchase.count({ where }),
    ])

    return paginatedResponse(purchases, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { items, supplierId, expectedDate, notes } = body

    if (!items?.length) return errorResponse('No items in purchase order')

    const poNo = `PO-${Date.now()}`
    let subtotal = 0

    const purchaseItems = items.map((item: { productId: string; quantity: number; unitPrice: number; taxRate?: number }) => {
      const total = item.quantity * item.unitPrice
      subtotal += total
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate ?? 0,
        taxAmount: total * ((item.taxRate ?? 0) / 100),
        total,
      }
    })

    const purchase = await prisma.purchase.create({
      data: {
        purchaseOrderNo: poNo,
        branchId: user.branchId ?? '',
        supplierId: supplierId || null,
        createdById: user.id,
        status: 'ORDERED',
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal,
        grandTotal: subtotal,
        notes,
        items: { create: purchaseItems },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        supplier: true,
      },
    })

    return successResponse(purchase, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
