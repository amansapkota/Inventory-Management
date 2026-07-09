import { compare, hash } from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { UserRole } from '@/generated/prisma/client'

const SESSION_COOKIE = 'session_token'
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash)
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY)
  const session = await prisma.loginHistory.create({
    data: { userId }
  })
  return session.id
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.loginHistory.findUnique({
    where: { id: token },
    include: {
      user: {
        include: {
          company: { select: { id: true, name: true, logo: true } },
          branch: { select: { id: true, name: true, code: true } }
        }
      }
    }
  })

  if (!session || !session.user.isActive) return null
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export function hasRole(user: { role: UserRole } | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function canAccess(user: { role: UserRole } | null, ...roles: UserRole[]): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN') return true
  return roles.includes(user.role)
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(...roles: UserRole[]) {
  const user = await requireAuth()
  if (!canAccess(user, ...roles)) {
    throw new Error('Forbidden')
  }
  return user
}

export function setSessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_EXPIRY / 1000,
    path: '/',
  }
}

export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  }
}
