import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const params = getSearchParams(request.url)
    const employeeId = searchParams.get('employeeId')

    const where: Record<string, unknown> = {
      employee: { companyId: user.companyId },
      ...(params.startDate && params.endDate && {
        date: { gte: new Date(params.startDate), lte: new Date(params.endDate) },
      }),
      ...(params.startDate && !params.endDate && { date: { gte: new Date(params.startDate) } }),
      ...(params.endDate && !params.startDate && { date: { lte: new Date(params.endDate) } }),
      ...(employeeId && { employeeId }),
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeCode: true, department: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.attendance.count({ where }),
    ])

    return paginatedResponse(records, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { employeeId, date, clockIn, clockOut, status, note } = body

    if (!employeeId || !date) return errorResponse('employeeId and date are required')

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    })
    if (!employee) return errorResponse('Employee not found', 404)

    const recordDate = new Date(date)
    recordDate.setHours(0, 0, 0, 0)

    const record = await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date: recordDate } },
      update: {
        clockIn: clockIn ? new Date(clockIn) : undefined,
        clockOut: clockOut ? new Date(clockOut) : undefined,
        status: status || 'PRESENT',
        note: note || null,
        userId: user.id,
      },
      create: {
        employeeId,
        userId: user.id,
        date: recordDate,
        clockIn: clockIn ? new Date(clockIn) : null,
        clockOut: clockOut ? new Date(clockOut) : null,
        status: status || 'PRESENT',
        note: note || null,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, department: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return successResponse(record, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
