import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const { status, note } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return errorResponse('Status must be APPROVED or REJECTED')
    }

    const leave = await prisma.leave.findFirst({
      where: { id, employee: { companyId: user.companyId } },
    })
    if (!leave) return errorResponse('Leave not found', 404)
    if (leave.status !== 'PENDING') return errorResponse('Leave is already ' + leave.status)

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status,
        approvedById: user.id,
        note: note || null,
      },
      include: {
        employee: { select: { id: true, employeeCode: true, department: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
