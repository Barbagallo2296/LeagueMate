import { createContext, useContext } from 'react'
import type { User } from '../api/types'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  isAdmin: boolean
  canOrganize: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
