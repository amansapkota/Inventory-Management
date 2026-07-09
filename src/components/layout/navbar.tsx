'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'

export function Navbar() {
  const { user } = useAuthStore()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, sales, customers..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>

        {user && (
          <div className="flex items-center gap-2 ml-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
