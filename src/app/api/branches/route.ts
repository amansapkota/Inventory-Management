import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const branches = await prisma.branch.findMany({
      where: { companyId: user.companyId },
      include: {
        _count: { select: { users: true, sales: true, warehouses: true } },
      },
      orderBy: { name: 'asc' },
    })
    return successResponse(branches)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, code, email, phone, address, city } = body

    if (!name || !code) return errorResponse('Name and code are required')

    const existing = await prisma.branch.findUnique({ where: { code } })
    if (existing) return errorResponse('Branch code already exists')

    const branch = await prisma.branch.create({
      data: { companyId: user.companyId, name, code, email, phone, address, city },
    })

    await prisma.warehouse.create({
      data: {
        companyId: user.companyId,
        branchId: branch.id,
        name: `${name} - Main Warehouse`,
        code: `WH-${code}`,
        type: 'main',
      },
    })

    return successResponse(branch, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
