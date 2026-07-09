'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: '', email: '', phone: '', address: '',
    panNo: '', regNo: '', website: '',
    currency: 'NPR', taxRate: 13, language: 'en',
    lowStockThreshold: 10, expiryWarningDays: 30,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setSettings(d.data)
        }
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const d = await res.json()
      if (d.success) {
        toast.success('Settings saved')
      } else {
        toast.error(d.error ?? 'Failed to save')
      }
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="max-w-2xl"><PageHeader title="Settings" description="Configure your retail platform" /><p className="text-muted-foreground p-6">Loading...</p></div>

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Configure your retail platform" />

      <Card>
        <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">Company Name</label><Input value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Phone</label><Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Address</label><Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} /></div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">PAN No</label><Input value={settings.panNo} onChange={(e) => setSettings({ ...settings, panNo: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Registration No</label><Input value={settings.regNo} onChange={(e) => setSettings({ ...settings, regNo: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Website</label><Input value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} /></div>

            <div className="border-t pt-4"><h3 className="font-medium mb-3">Regional Settings</h3></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><label className="text-sm font-medium">Currency</label>
                <Select value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} options={[
                  { label: 'NPR - Nepalese Rupee', value: 'NPR' },
                  { label: 'USD - US Dollar', value: 'USD' },
                  { label: 'INR - Indian Rupee', value: 'INR' },
                ]} />
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Tax Rate (%)</label>
                <Input type="number" value={settings.taxRate} onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Language</label>
                <Select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} options={[
                  { label: 'English', value: 'en' },
                  { label: 'Nepali', value: 'np' },
                  { label: 'Hindi', value: 'hi' },
                ]} />
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Low Stock Threshold</label>
                <Input type="number" value={settings.lowStockThreshold} onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Expiry Warning Days</label>
                <Input type="number" value={settings.expiryWarningDays} onChange={(e) => setSettings({ ...settings, expiryWarningDays: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <Button type="submit" className="mt-4" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
