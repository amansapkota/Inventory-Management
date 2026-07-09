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
          { firstName: { contains: params.search } },
          { lastName: { contains: params.search } },
          { phone: { contains: params.search } },
          { email: { contains: params.search } },
        ],
      }),
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: { _count: { select: { sales: true } } },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.customer.count({ where }),
    ])

    return paginatedResponse(customers, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { firstName, lastName, email, phone, address, city, dob, creditLimit } = body

    if (!firstName || !phone) return errorResponse('First name and phone are required')

    const count = await prisma.customer.count({ where: { companyId: user.companyId } })
    const code = `CUST-${String(count + 1).padStart(5, '0')}`

    const customer = await prisma.customer.create({
      data: {
        companyId: user.companyId,
        code,
        firstName, lastName, email, phone, address, city,
        dob: dob ? new Date(dob) : null,
        creditLimit: creditLimit || 0,
      },
    })

    return successResponse(customer, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
