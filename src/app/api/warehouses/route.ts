import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const warehouses = await prisma.warehouse.findMany({
      where: { companyId: user.companyId },
      include: { branch: { select: { name: true } } },
      orderBy: { name: 'asc' },
    })
    return successResponse(warehouses)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, code, address, city, type, branchId } = body

    if (!name || !code) return errorResponse('Name and code are required')

    const existing = await prisma.warehouse.findUnique({ where: { code } })
    if (existing) return errorResponse('Warehouse code already exists')

    const warehouse = await prisma.warehouse.create({
      data: {
        companyId: user.companyId, name, code, address, city,
        type: type || 'storage',
        branchId: branchId || null,
      },
    })

    return successResponse(warehouse, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
