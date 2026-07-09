import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const sale = await prisma.sale.findFirst({
      where: { id, branch: { companyId: user.companyId } },
      include: {
        items: { include: { product: true, variant: true } },
        payments: true,
        customer: true,
        cashier: { select: { id: true, firstName: true, lastName: true } },
        branch: true,
        saleReturns: { include: { items: true } },
      },
    })

    if (!sale) return errorResponse('Sale not found', 404)
    return successResponse(sale)
  } catch (error) {
    return handleApiError(error)
  }
}
