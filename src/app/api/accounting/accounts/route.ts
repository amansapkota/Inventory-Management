import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const accounts = await prisma.account.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { code: 'asc' },
    })
    return successResponse(accounts)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { code, name, type, description, parentId } = body

    if (!code || !name || !type) return errorResponse('Code, name, and type are required')

    const account = await prisma.account.create({
      data: {
        companyId: user.companyId, code, name, type, description,
        parentId: parentId || null,
      },
    })

    return successResponse(account, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
