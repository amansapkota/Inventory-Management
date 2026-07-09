'use client'

import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.data)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }
    loadUser()
  }, [setUser, setLoading])

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '8px', background: '#333', color: '#fff' },
        }}
      />
    </>
  )
}
