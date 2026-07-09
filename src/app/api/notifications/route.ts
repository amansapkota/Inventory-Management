import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, handleApiError, paginatedResponse } from '@/lib/api'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '20')

    const where = { userId: user.id }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ])

    return paginatedResponse(notifications, total, page, limit)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return successResponse({ message: 'All notifications marked as read' })
    }

    if (!body.id) {
      return errorResponse('Notification ID is required')
    }

    const notification = await prisma.notification.findFirst({
      where: { id: body.id, userId: user.id },
    })

    if (!notification) {
      return errorResponse('Notification not found', 404)
    }

    const updated = await prisma.notification.update({
      where: { id: body.id },
      data: { isRead: true, readAt: new Date() },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
