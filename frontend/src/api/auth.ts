import { api } from './client'
import type { TokenResponse, User } from './types'

export interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', { username, password })
  return data
}

export async function register(input: RegisterData): Promise<User> {
  const { data } = await api.post<User>('/auth/register', input)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
