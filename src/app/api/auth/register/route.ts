import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { successResponse, errorResponse, handleApiError } from '@/lib/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, email, password, firstName, lastName, phone } = body

    if (!companyName || !email || !password || !firstName || !lastName) {
      return errorResponse('Missing required fields')
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return errorResponse('Email already registered')
    }

    const passwordHash = await hashPassword(password)

    const company = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.create({
        data: {
          name: companyName,
          email,
          phone,
          settings: { create: {} },
          users: {
            create: {
              email,
              passwordHash,
              firstName,
              lastName,
              phone,
              role: 'SUPER_ADMIN',
            },
          },
        },
        include: { users: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
      })

      const user = comp.users[0]

      const defaultBranch = await tx.branch.create({
        data: {
          companyId: comp.id,
          name: 'Main Branch',
          code: 'MAIN',
        },
      })

      await tx.warehouse.create({
        data: {
          companyId: comp.id,
          branchId: defaultBranch.id,
          name: 'Main Warehouse',
          code: 'WH-MAIN',
          type: 'main',
          address: defaultBranch.address,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: { branchId: defaultBranch.id },
      })

      return { company: { id: comp.id, name: comp.name }, user: { ...user, branchId: defaultBranch.id } }
    })

    return successResponse(company, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
