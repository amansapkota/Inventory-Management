import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/api'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }
    const { passwordHash, ...safeUser } = user
    return successResponse(safeUser)
  } catch {
    return errorResponse('Unauthorized', 401)
  }
}
