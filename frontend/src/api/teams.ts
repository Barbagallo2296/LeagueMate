import { api } from './client'
import type { Page, Team } from './types'

export async function getTeams(): Promise<Team[]> {
  const { data } = await api.get<Page<Team>>('/teams', { params: { size: 100, sort: 'name' } })
  return data.content
}

export async function createTeam(name: string): Promise<Team> {
  const { data } = await api.post<Team>('/teams', { name })
  return data
}
