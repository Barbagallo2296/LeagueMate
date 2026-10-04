import { api } from './client'
import type { Page, Role, User, UserProfile } from './types'

export interface ProfileData {
  bio: string
  avatarUrl: string
  phoneNumber: string
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export interface AccountData {
  firstName: string
  lastName: string
  email: string
}

export interface PasswordData {
  currentPassword: string
  newPassword: string
}

export async function updateAccount(input: AccountData): Promise<User> {
  const { data } = await api.put<User>('/users/me', input)
  return data
}

export async function changePassword(input: PasswordData): Promise<void> {
  await api.put('/users/me/password', input)
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<Page<User>>('/users', { params: { size: 100, sort: 'id' } })
  return data.content
}

export async function updateRole(userId: number, role: Role): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}/role`, { role })
  return data
}

export async function getProfile(userId: number): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/users/${userId}/profile`)
  return data
}

export async function updateProfile(userId: number, input: ProfileData): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>(`/users/${userId}/profile`, input)
  return data
}
