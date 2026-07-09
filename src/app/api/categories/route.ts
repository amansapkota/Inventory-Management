import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const categories = await prisma.category.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
    return successResponse(categories)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, parentId, description } = body

    if (!name) return errorResponse('Category name is required')

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const category = await prisma.category.create({
      data: {
        companyId: user.companyId,
        name,
        slug,
        parentId: parentId || null,
        description,
      },
    })

    return successResponse(category, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
