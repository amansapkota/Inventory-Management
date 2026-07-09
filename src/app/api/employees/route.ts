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
          { user: { firstName: { contains: params.search } } },
          { user: { lastName: { contains: params.search } } },
          { employeeCode: { contains: params.search } },
        ],
      }),
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.employee.count({ where }),
    ])

    return paginatedResponse(employees, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { firstName, lastName, email, phone, password, role, designation, department, salary, joiningDate } = body

    if (!firstName || !lastName || !email || !password) {
      return errorResponse('Required fields missing')
    }

    const { hashPassword } = await import('@/lib/auth')
    const passwordHash = await hashPassword(password)

    const appUser = await prisma.user.create({
      data: {
        email, passwordHash, firstName, lastName, phone, role: role || 'CASHIER',
        companyId: user.companyId,
        branchId: body.branchId || null,
      },
    })

    const count = await prisma.employee.count()
    const employee = await prisma.employee.create({
      data: {
        companyId: user.companyId,
        userId: appUser.id,
        employeeCode: `EMP-${String(count + 1).padStart(4, '0')}`,
        designation, department,
        salary: salary || 0,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    })

    return successResponse(employee, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
