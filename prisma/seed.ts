import 'dotenv/config'
import { hash } from 'bcryptjs'
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

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  const existing = await prisma.company.findFirst()
  if (existing) {
    console.log('Database already seeded, skipping...')
    return
  }

  const passwordHash = await hash('admin123', 12)

  const company = await prisma.company.create({
    data: {
      name: 'RetailPro Demo Company',
      email: 'admin@retailpro.com',
      phone: '+977-1-4XXXXXX',
      settings: {
        create: {
          currency: 'NPR',
          taxRate: 13,
          timezone: 'Asia/Kathmandu',
          language: 'en',
        },
      },
      users: {
        create: {
          email: 'admin@retailpro.com',
          passwordHash,
          firstName: 'Super',
          lastName: 'Admin',
          phone: '+977-98XXXXXXXX',
          role: 'SUPER_ADMIN',
        },
      },
    },
    include: { users: true, settings: true },
  })

  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Main Branch - Kathmandu',
      code: 'KTM-001',
      email: 'ktm@retailpro.com',
      phone: '+977-1-4XXXXXX',
      address: 'Durbar Marg',
      city: 'Kathmandu',
    },
  })

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      name: 'Main Warehouse',
      code: 'WH-KTM-001',
      address: 'Durbar Marg',
      city: 'Kathmandu',
      type: 'main',
    },
  })

  const categories = await Promise.all([
    prisma.category.create({ data: { companyId: company.id, name: 'Electronics', slug: 'electronics' } }),
    prisma.category.create({ data: { companyId: company.id, name: 'Groceries', slug: 'groceries' } }),
    prisma.category.create({ data: { companyId: company.id, name: 'Clothing', slug: 'clothing' } }),
    prisma.category.create({ data: { companyId: company.id, name: 'Home Goods', slug: 'home-goods' } }),
  ])

  const taxRate = await prisma.taxRate.create({
    data: { companyId: company.id, name: 'VAT 13%', rate: 13, type: 'VAT' },
  })

  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: company.id, categoryId: categories[0].id,
        name: 'Smart Speaker', sku: 'ELEC-SPK-001', barcode: '8901234567890',
        unit: 'pcs', purchasePrice: 2500, sellingPrice: 3999,
        minStock: 5, slug: 'smart-speaker',
        taxRateId: taxRate.id,
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id, categoryId: categories[1].id,
        name: 'Basmati Rice 5kg', sku: 'GROC-RCE-001', barcode: '8901234567891',
        unit: 'pcs', purchasePrice: 650, sellingPrice: 895,
        minStock: 20, slug: 'basmati-rice-5kg',
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id, categoryId: categories[1].id,
        name: 'Cooking Oil 1L', sku: 'GROC-OIL-001', barcode: '8901234567892',
        unit: 'pcs', purchasePrice: 280, sellingPrice: 395,
        minStock: 30, slug: 'cooking-oil-1l',
      },
    }),
    prisma.product.create({
      data: {
        companyId: company.id, categoryId: categories[2].id,
        name: 'Men Cotton T-Shirt', sku: 'CLTH-TSH-001', barcode: '8901234567893',
        unit: 'pcs', purchasePrice: 450, sellingPrice: 899,
        minStock: 10, slug: 'men-cotton-tshirt',
      },
    }),
  ])

  for (const product of products) {
    await prisma.stock.create({
      data: { productId: product.id, warehouseId: warehouse.id, quantity: 100, minStock: product.minStock },
    })
  }

  await prisma.customer.create({
    data: {
      companyId: company.id, code: 'CUST-00001',
      firstName: 'Ram', lastName: 'Sharma',
      phone: '+977-98XXXXXXXX', email: 'ram@email.com',
      address: 'New Road', city: 'Kathmandu',
    },
  })

  await prisma.supplier.create({
    data: {
      companyId: company.id, code: 'SUPP-00001',
      name: 'Wholesale Traders Pvt Ltd',
      contactPerson: 'Hari Bahadur',
      phone: '+977-98XXXXXXXX',
      address: 'Teku', city: 'Kathmandu',
    },
  })

  await Promise.all([
    prisma.account.create({ data: { companyId: company.id, code: '1001', name: 'Cash', type: 'asset' } }),
    prisma.account.create({ data: { companyId: company.id, code: '1002', name: 'Bank Account', type: 'asset' } }),
    prisma.account.create({ data: { companyId: company.id, code: '4001', name: 'Sales Revenue', type: 'income' } }),
    prisma.account.create({ data: { companyId: company.id, code: '5001', name: 'Cost of Goods Sold', type: 'expense' } }),
    prisma.account.create({ data: { companyId: company.id, code: '6001', name: 'Rent Expense', type: 'expense' } }),
  ])

  console.log('Seed completed!')
  console.log(`Company: ${company.name}`)
  console.log(`Admin: admin@retailpro.com / admin123`)
  console.log(`Branch: ${branch.name}`)
  console.log(`Products: ${products.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
