import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import { refreshAccessToken, setSessionExpiredHandler } from '../api/client'
import { clearTokens, getRefreshToken, saveTokens } from '../api/tokens'
import type { User } from '../api/types'
import { getMe } from '../api/users'
import { AuthContext } from './authContext'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getRefreshToken() !== null)
  const queryClient = useQueryClient()

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearTokens()
      setUser(null)
      queryClient.clear()
    })

    if (!getRefreshToken()) {
      return
    }
    refreshAccessToken()
      .then(getMe)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [queryClient])

  async function login(username: string, password: string) {
    const tokens = await authApi.login(username, password)
    saveTokens(tokens.access_token, tokens.refresh_token)
    setUser(await getMe())
  }

  async function logout() {
    await authApi.logout().catch(() => undefined)
    clearTokens()
    setUser(null)
    queryClient.clear()
  }

  const isAdmin = user?.role === 'ADMIN'
  const canOrganize = isAdmin || user?.role === 'ORGANIZER'

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, canOrganize, login, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  )
}
