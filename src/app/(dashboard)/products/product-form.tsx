'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import toast from 'react-hot-toast'
import type { Product } from '@/generated/prisma/client'

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
  onCancel: () => void
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    categoryId: product?.categoryId ?? '',
    brandId: product?.brandId ?? '',
    unit: product?.unit ?? 'pcs',
    purchasePrice: product?.purchasePrice ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    wholesalePrice: product?.wholesalePrice ?? 0,
    minStock: product?.minStock ?? 0,
    maxStock: product?.maxStock ?? 0,
    description: product?.description ?? '',
    trackBatch: product?.trackBatch ?? false,
    trackExpiry: product?.trackExpiry ?? false,
    warrantyPeriod: product?.warrantyPeriod ?? 0,
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.data || [])),
      fetch('/api/brands').then(r => r.json()).then(d => setBrands(d.data || [])),
    ])
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success(product ? 'Product updated' : 'Product created')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Name *</label>
          <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU *</label>
          <Input required value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} disabled={!!product} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Barcode</label>
          <Input value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Unit</label>
          <Select
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            options={[
              { label: 'Pieces (pcs)', value: 'pcs' },
              { label: 'Kilogram (kg)', value: 'kg' },
              { label: 'Gram (g)', value: 'g' },
              { label: 'Liter (L)', value: 'L' },
              { label: 'Milliliter (ml)', value: 'ml' },
              { label: 'Meter (m)', value: 'm' },
              { label: 'Box', value: 'box' },
              { label: 'Pack', value: 'pack' },
              { label: 'Carton', value: 'carton' },
            ]}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            options={categories.map(c => ({ label: c.name, value: c.id }))}
            placeholder="Select category"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand</label>
          <Select
            value={formData.brandId}
            onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
            options={brands.map(b => ({ label: b.name, value: b.id }))}
            placeholder="Select brand"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Purchase Price</label>
          <Input type="number" step="0.01" value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Selling Price</label>
          <Input type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Wholesale Price</label>
          <Input type="number" step="0.01" value={formData.wholesalePrice} onChange={(e) => setFormData({ ...formData, wholesalePrice: parseFloat(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Min Stock Level</label>
          <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Max Stock Level</label>
          <Input type="number" value={formData.maxStock} onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Warranty (days)</label>
          <Input type="number" value={formData.warrantyPeriod} onChange={(e) => setFormData({ ...formData, warrantyPeriod: parseInt(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium mt-6">
            <input type="checkbox" checked={formData.trackBatch} onChange={(e) => setFormData({ ...formData, trackBatch: e.target.checked })} />
            Track by Batch
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={formData.trackExpiry} onChange={(e) => setFormData({ ...formData, trackExpiry: e.target.checked })} />
            Track Expiry
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
