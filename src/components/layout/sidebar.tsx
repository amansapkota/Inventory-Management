'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ShoppingCart, Package, BarChart3, Users, Truck,
  Store, Warehouse, Receipt, FileText, Settings, LogOut, ChevronLeft,
  DollarSign, UserCheck, Bell, ShoppingBag, Menu, ArrowRightLeft,
  Medal, Ticket,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: string[]
}

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'POS', href: '/pos', icon: <ShoppingCart size={20} /> },
  { label: 'Products', href: '/products', icon: <Package size={20} /> },
  { label: 'Inventory', href: '/inventory', icon: <Warehouse size={20} /> },
  { label: 'Transfers', href: '/inventory/transfers', icon: <ArrowRightLeft size={20} /> },
  { label: 'Sales', href: '/sales', icon: <Receipt size={20} /> },
  { label: 'Purchases', href: '/purchases', icon: <Truck size={20} /> },
  { label: 'Customers', href: '/customers', icon: <Users size={20} /> },
  { label: 'Memberships', href: '/customers/memberships', icon: <Medal size={20} /> },
  { label: 'Coupons', href: '/customers/coupons', icon: <Ticket size={20} /> },
  { label: 'Suppliers', href: '/suppliers', icon: <Truck size={20} /> },
  { label: 'Employees', href: '/employees', icon: <UserCheck size={20} /> },
  { label: 'Accounting', href: '/accounting', icon: <DollarSign size={20} /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 size={20} /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell size={20} /> },
  { label: 'Branches', href: '/branches', icon: <Store size={20} /> },
  { label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <ShoppingBag className="text-primary" size={24} />
            <span>RetailPro</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto', collapsed && 'mx-auto')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-2">
        {!collapsed && user && (
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {user.firstName} {user.lastName}
            <div className="font-medium text-foreground">{user.role}</div>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn('w-full justify-start gap-3', collapsed && 'justify-center px-2')}
          onClick={logout}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </aside>
  )
}
