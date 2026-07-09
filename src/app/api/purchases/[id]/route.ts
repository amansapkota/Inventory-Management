import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, branch: { companyId: user.companyId } },
      include: {
        items: { include: { product: true, variant: true } },
        payments: true,
        supplier: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        branch: true,
        goodsReceipt: { include: { items: true } },
        returns: { include: { items: true } },
      },
    })

    if (!purchase) return errorResponse('Purchase not found', 404)
    return successResponse(purchase)
  } catch (error) {
    return handleApiError(error)
  }
}
