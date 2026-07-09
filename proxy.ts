import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/register', '/forgot-password', '/api/auth']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = publicPaths.some(path => pathname.startsWith(path))
  const isApi = pathname.startsWith('/api')
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon')

  if (isPublic || isStatic) {
    return NextResponse.next()
  }

  const token = request.cookies.get('session_token')?.value

  if (!token && !isApi) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!token && isApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
