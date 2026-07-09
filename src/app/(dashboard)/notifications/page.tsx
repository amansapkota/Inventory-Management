'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Bell, CheckCheck, Package, AlertTriangle, ShoppingCart, CreditCard, Megaphone, Settings, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const typeIcons: Record<string, React.ReactNode> = {
  LOW_STOCK: <Package size={18} className="text-orange-500" />,
  EXPIRY: <AlertTriangle size={18} className="text-red-500" />,
  NEW_ORDER: <ShoppingCart size={18} className="text-blue-500" />,
  PAYMENT_DUE: <CreditCard size={18} className="text-yellow-500" />,
  PROMOTION: <Megaphone size={18} className="text-purple-500" />,
  SYSTEM: <Settings size={18} className="text-gray-500" />,
}

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`)
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data)
        setTotalPages(json.totalPages)
        setPage(json.page)
      }
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(1)
  }, [fetchNotifications])

  async function markAsRead(id: string) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      const json = await res.json()
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        toast.success('All notifications marked as read')
      }
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay updated with system activities">
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} disabled={markingAll}>
            {markingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
            Mark all read
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell size={40} className="mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    !n.isRead ? 'bg-muted/30' : ''
                  } ${!n.isRead ? 'cursor-pointer' : ''}`}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                >
                  <div className="mt-0.5">{typeIcons[n.type] || <Bell size={18} />}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${!n.isRead ? 'font-semibold' : ''}`}>{n.title}</p>
                      {!n.isRead && <Badge variant="info" className="text-[10px] px-1.5 py-0">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt, 'datetime')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchNotifications(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => fetchNotifications(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
