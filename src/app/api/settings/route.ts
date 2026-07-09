import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, handleApiError } from '@/lib/api'

export async function GET() {
  try {
    const user = await requireAuth()

    const settings = await prisma.companySettings.findUnique({
      where: { companyId: user.companyId },
    })

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: {
        name: true, email: true, phone: true, address: true,
        panNo: true, regNo: true, website: true,
      },
    })

    return successResponse({
      companyName: company?.name ?? '',
      email: company?.email ?? '',
      phone: company?.phone ?? '',
      address: company?.address ?? '',
      panNo: company?.panNo ?? '',
      regNo: company?.regNo ?? '',
      website: company?.website ?? '',
      currency: settings?.currency ?? 'NPR',
      taxRate: settings?.taxRate ?? 13,
      language: settings?.language ?? 'en',
      lowStockThreshold: settings?.lowStockThreshold ?? 10,
      expiryWarningDays: settings?.expiryWarningDays ?? 30,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const {
      companyName, email, phone, address, panNo, regNo, website,
      currency, taxRate, language, lowStockThreshold, expiryWarningDays,
    } = body

    await prisma.company.update({
      where: { id: user.companyId },
      data: {
        name: companyName,
        email: email || null,
        phone: phone || null,
        address: address || null,
        panNo: panNo || null,
        regNo: regNo || null,
        website: website || null,
      },
    })

    const settings = await prisma.companySettings.upsert({
      where: { companyId: user.companyId },
      create: {
        companyId: user.companyId,
        currency: currency || 'NPR',
        taxRate: taxRate ?? 13,
        language: language || 'en',
        lowStockThreshold: lowStockThreshold ?? 10,
        expiryWarningDays: expiryWarningDays ?? 30,
      },
      update: {
        currency: currency || 'NPR',
        taxRate: taxRate ?? 13,
        language: language || 'en',
        lowStockThreshold: lowStockThreshold ?? 10,
        expiryWarningDays: expiryWarningDays ?? 30,
      },
    })

    return successResponse(settings)
  } catch (error) {
    return handleApiError(error)
  }
}
