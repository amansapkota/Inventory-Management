import { prisma } from '@/lib/prisma'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return errorResponse('Email and password are required')
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: { select: { id: true, name: true, logo: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    })

    if (!user || !user.isActive) {
      return errorResponse('Invalid email or password', 401)
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return errorResponse('Invalid email or password', 401)
    }

    const sessionId = await createSession(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const { passwordHash, ...safeUser } = user
    const response = successResponse({ user: safeUser })
    response.cookies.set(setSessionCookie(sessionId))

    return response
  } catch (error) {
    return handleApiError(error)
  }
}
