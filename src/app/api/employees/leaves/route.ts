import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const params = getSearchParams(request.url)

    const where: Record<string, unknown> = {
      employee: { companyId: user.companyId },
      ...(params.status && { status: params.status }),
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeCode: true, department: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.leave.count({ where }),
    ])

    return paginatedResponse(leaves, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { employeeId, type, startDate, endDate, reason } = body

    if (!employeeId || !startDate || !endDate || !reason) {
      return errorResponse('employeeId, startDate, endDate, and reason are required')
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    })
    if (!employee) return errorResponse('Employee not found', 404)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        userId: user.id,
        type: type || 'annual',
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: 'PENDING',
      },
      include: {
        employee: { select: { id: true, employeeCode: true, department: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return successResponse(leave, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
