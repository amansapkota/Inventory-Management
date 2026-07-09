import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()
    const brands = await prisma.brand.findMany({
      where: { companyId: user.companyId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })
    return successResponse(brands)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, description } = body

    if (!name) return errorResponse('Brand name is required')

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const brand = await prisma.brand.create({
      data: { companyId: user.companyId, name, slug, description },
    })

    return successResponse(brand, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
