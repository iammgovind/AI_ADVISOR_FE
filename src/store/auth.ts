import { create } from 'zustand'
import type { User } from '../api/users'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

const getStoredUser = (): User | null => {
  const stored = localStorage.getItem('user')
  if (!stored) return null

  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  setUser: (user) => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
    set({ user })
  },
  logout: () => {
    localStorage.clear()
    set({ user: null })
  },
}))
