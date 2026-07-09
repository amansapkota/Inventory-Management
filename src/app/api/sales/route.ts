import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      branch: { companyId: user.companyId },
      ...(params.branchId && { branchId: params.branchId }),
      ...(params.status && { status: params.status }),
      ...(params.search && {
        OR: [
          { invoiceNo: { contains: params.search } },
          { customer: { firstName: { contains: params.search } } },
          { customer: { lastName: { contains: params.search } } },
        ],
      }),
      ...(params.startDate && params.endDate && {
        createdAt: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
      }),
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          cashier: { select: { id: true, firstName: true, lastName: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.sale.count({ where }),
    ])

    return paginatedResponse(sales, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const { items, customerId, paymentMethod, paidAmount, discount, notes, posData, warehouseId: reqWarehouseId } = body

    if (!items?.length) return errorResponse('No items in sale')

    const branchId = user.branchId || (await prisma.branch.findFirst({ where: { companyId: user.companyId, isActive: true } }))?.id
    if (!branchId) return errorResponse('No branch assigned. Contact your administrator.', 400)

    const warehouseId = reqWarehouseId || (await prisma.warehouse.findFirst({ where: { companyId: user.companyId, type: 'main' } }))?.id
    if (!warehouseId) return errorResponse('No warehouse found. Contact your administrator.', 400)

    const invoiceNo = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    let subtotal = 0
    let taxTotal = 0

    const saleItems = items.map((item: { productId: string; quantity: number; unitPrice: number; discount?: number; taxRate?: number }) => {
      const itemTotal = item.quantity * item.unitPrice
      subtotal += itemTotal
      const taxAmount = itemTotal * ((item.taxRate ?? 0) / 100)
      taxTotal += taxAmount
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount ?? 0,
        taxRate: item.taxRate ?? 0,
        taxAmount,
        total: itemTotal - (item.discount ?? 0) + taxAmount,
      }
    })

    const grandTotal = subtotal + taxTotal - (discount ?? 0)

    const result = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const stock = await tx.stock.findUnique({
          where: { productId_warehouseId: { productId: item.productId, warehouseId } },
        })

        if (!stock || stock.quantity < item.quantity) {
          const product = await tx.product.findUnique({ where: { id: item.productId }, select: { name: true } })
          throw new Error(`Insufficient stock for ${product?.name ?? item.productId}. Available: ${stock?.quantity ?? 0}, Requested: ${item.quantity}`)
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId,
            type: 'OUT',
            quantity: item.quantity,
            reference: invoiceNo,
            createdById: user.id,
          },
        })
      }

      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          branchId,
          cashierId: user.id,
          customerId: customerId || null,
          status: 'COMPLETED',
          subtotal,
          discountTotal: discount ?? 0,
          taxTotal,
          grandTotal,
          paidAmount: paidAmount ?? grandTotal,
          changeAmount: Math.max(0, (paidAmount ?? grandTotal) - grandTotal),
          dueAmount: Math.max(0, grandTotal - (paidAmount ?? grandTotal)),
          paymentMethod: paymentMethod ?? 'CASH',
          posData: posData || null,
          notes,
          items: { create: saleItems },
          payments: {
            create: {
              method: paymentMethod ?? 'CASH',
              amount: paidAmount ?? grandTotal,
            },
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          customer: true,
        },
      })

      return sale
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
