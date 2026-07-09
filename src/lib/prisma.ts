import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb({
  host: '209.50.240.123',
  port: 3306,
  user: 'alum_crm',
  password: 'CRM',
  database: 'alum_crm',
  connectionLimit: 2,
  connectTimeout: 30000,
  socketTimeout: 60000,
  prepareCacheLength: 0,
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
