import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      companyId: user.companyId,
      ...(params.search && {
        OR: [
          { name: { contains: params.search } },
          { phone: { contains: params.search } },
          { email: { contains: params.search } },
        ],
      }),
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: { _count: { select: { purchases: true } } },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.supplier.count({ where }),
    ])

    return paginatedResponse(suppliers, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { name, contactPerson, email, phone, address, city, panNo, paymentTerms, creditLimit } = body

    if (!name || !phone) return errorResponse('Name and phone are required')

    const count = await prisma.supplier.count({ where: { companyId: user.companyId } })
    const code = `SUPP-${String(count + 1).padStart(5, '0')}`

    const supplier = await prisma.supplier.create({
      data: {
        companyId: user.companyId, code, name, contactPerson, email, phone, address, city,
        panNo, paymentTerms, creditLimit: creditLimit || null,
      },
    })

    return successResponse(supplier, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
