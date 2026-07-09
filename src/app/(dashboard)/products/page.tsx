'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Modal } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from './product-form'
import { BarcodeDisplay } from '@/components/barcode/barcode-display'
import { formatCurrency } from '@/lib/utils'
import { Plus, Pencil, Printer, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Product } from "@prisma/client";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showLabels, setShowLabels] = useState(false)

  async function loadProducts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search })
      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.data)
        setTotal(data.total)
      }
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [page, search])

  const columns = [
    { key: 'name', label: 'Product', sortable: true, render: (item: Product) => (
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
      </div>
    )},
    { key: 'barcode', label: 'Barcode', render: (item: Product) => (
      item.barcode ? <BarcodeDisplay value={item.barcode} height={28} width={1} fontSize={10} /> : <span className="text-xs text-muted-foreground">-</span>
    )},
    { key: 'category', label: 'Category', render: (item: Product & { category?: { name: string } }) => item.category?.name ?? '-' },
    { key: 'purchasePrice', label: 'Cost', render: (item: Product) => formatCurrency(item.purchasePrice) },
    { key: 'sellingPrice', label: 'Price', render: (item: Product) => formatCurrency(item.sellingPrice) },
    { key: 'stock', label: 'Stock', render: (item: Product & { stock?: Array<{ quantity: number }> }) => {
      const totalStock = item.stock?.reduce((s, st) => s + st.quantity, 0) ?? 0
      return (
        <Badge variant={totalStock <= (item.minStock || 0) ? 'destructive' : totalStock < 20 ? 'warning' : 'success'}>
          {totalStock}
        </Badge>
      )
    }},
    { key: 'isActive', label: 'Status', render: (item: Product) => (
      <Badge variant={item.isActive ? 'success' : 'secondary'}>{item.isActive ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'actions', label: '', render: (item: Product) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => { setEditProduct(item); setShowForm(true) }}>
          <Pencil size={16} />
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Products" description={`${total} products total`}>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowLabels(true)}>
            <Tag size={16} /> Print Labels
          </Button>
          <Button onClick={() => { setEditProduct(null); setShowForm(true) }}>
            <Plus size={16} /> Add Product
          </Button>
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        data={products as never[]}
        total={total}
        page={page}
        search={search}
        loading={loading}
        onSearch={setSearch}
        onPageChange={setPage}
      />

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        size="xl"
      >
        <ProductForm
          product={editProduct}
          onSuccess={() => { setShowForm(false); loadProducts() }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal
        open={showLabels}
        onClose={() => setShowLabels(false)}
        title="Print Barcode Labels"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Barcode labels for all products. You can print this page or export as PDF.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.filter(p => p.barcode).map((product) => (
              <div key={product.id} className="border rounded-lg p-3 text-center print:border print:rounded-none print:p-2">
                <div className="text-xs font-medium truncate mb-1">{product.name}</div>
                <div className="text-[10px] text-muted-foreground mb-2">{product.sku}</div>
                <div className="flex justify-center">
                  <BarcodeDisplay value={product.barcode!} height={40} width={1.2} fontSize={10} />
                </div>
                {product.sellingPrice > 0 && (
                  <div className="text-sm font-bold mt-1">${product.sellingPrice.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
          {products.filter(p => p.barcode).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products with barcodes yet. Add barcodes to your products first.
            </p>
          )}
          <div className="flex justify-end gap-2 print:hidden">
            <Button variant="outline" onClick={() => setShowLabels(false)}>Close</Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} /> Print Labels
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
