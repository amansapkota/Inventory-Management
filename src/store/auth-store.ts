'use client'

import { create } from 'zustand'
import type { SafeUser } from '@/types'

interface AuthState {
  user: SafeUser | null
  isLoading: boolean
  setUser: (user: SafeUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      set({ user: null })
      window.location.href = '/login'
    } catch {
      set({ user: null })
      window.location.href = '/login'
    }
  },
}))
