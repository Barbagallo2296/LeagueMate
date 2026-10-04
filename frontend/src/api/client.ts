import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './tokens'
import type { ApiError, TokenResponse } from './types'

type RetriableRequest = InternalAxiosRequestConfig & { retried?: boolean }

export const api = axios.create({ baseURL: '/api' })

let refreshPromise: Promise<string> | null = null
let onSessionExpired: () => void = () => {}

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

async function requestNewTokens(): Promise<string> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  try {
    const { data } = await axios.post<TokenResponse>('/api/auth/refresh', { refresh_token: refreshToken })
    saveTokens(data.access_token, data.refresh_token)
    return data.access_token
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      clearTokens()
    }
    throw error
  }
}

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequest | undefined
    const isAuthCall = original?.url?.startsWith('/auth/') ?? false
    if (error.response?.status !== 401 || !original || original.retried || isAuthCall) {
      return Promise.reject(error)
    }
    original.retried = true
    try {
      const token = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      onSessionExpired()
      return Promise.reject(error)
    }
  },
)

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const data = error.response?.data
    if (data?.messages?.length) {
      return data.messages.join(', ')
    }
    if (data?.message) {
      return data.message
    }
    if (!error.response) {
      return 'Server non raggiungibile'
    }
  }
  return 'Si è verificato un errore'
}
