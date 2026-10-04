import { api } from './client'
import type { Page, Tournament, TournamentStatus } from './types'

export interface NewTournamentData {
  name: string
  season: string
  doubleRoundRobin: boolean
}

export async function getTournaments(status?: TournamentStatus): Promise<Tournament[]> {
  const url = status ? `/tournaments/status/${status}` : '/tournaments'
  const { data } = await api.get<Page<Tournament>>(url, { params: { size: 50, sort: 'id,desc' } })
  return data.content
}

export async function createTournament(input: NewTournamentData): Promise<Tournament> {
  const { data } = await api.post<Tournament>('/tournaments', input)
  return data
}
