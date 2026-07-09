import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, paginatedResponse, getSearchParams, errorResponse, handleApiError } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const params = getSearchParams(request.url)
    const periodStart = searchParams.get('periodStart')
    const periodEnd = searchParams.get('periodEnd')

    const where: Record<string, unknown> = {
      employee: { companyId: user.companyId },
      ...(periodStart && periodEnd && {
        periodStart: { gte: new Date(periodStart) },
        periodEnd: { lte: new Date(periodEnd) },
      }),
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: { select: { id: true, employeeCode: true, department: true, designation: true } },
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.payroll.count({ where }),
    ])

    return paginatedResponse(payrolls, total, params.page, params.limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { employeeId, periodStart, periodEnd, basicSalary, allowances, deductions, commission, bonus, taxDeduction } = body

    if (!employeeId || !periodStart || !periodEnd) {
      return errorResponse('employeeId, periodStart, and periodEnd are required')
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId: user.companyId },
    })
    if (!employee) return errorResponse('Employee not found', 404)

    const bs = basicSalary || 0
    const al = allowances || 0
    const dc = deductions || 0
    const cm = commission || 0
    const bn = bonus || 0
    const tx = taxDeduction || 0
    const netSalary = bs + al + cm + bn - dc - tx

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        userId: user.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        basicSalary: bs,
        allowances: al,
        deductions: dc,
        commission: cm,
        bonus: bn,
        taxDeduction: tx,
        netSalary,
        paymentStatus: 'pending',
      },
      include: {
        employee: { select: { id: true, employeeCode: true, department: true, designation: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return successResponse(payroll, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { id } = body

    if (!id) return errorResponse('Payroll id is required')

    const payroll = await prisma.payroll.findFirst({
      where: { id, employee: { companyId: user.companyId } },
    })
    if (!payroll) return errorResponse('Payroll not found', 404)

    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        paymentStatus: 'paid',
        paidAt: new Date(),
      },
      include: {
        employee: { select: { id: true, employeeCode: true, department: true, designation: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
