import { api } from './client'
import type {
  Page,
  Round,
  StandingEntry,
  Team,
  Tournament,
  TournamentStats,
  TournamentStatus,
} from './types'

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

export async function getTournament(id: number): Promise<Tournament> {
  const { data } = await api.get<Tournament>(`/tournaments/${id}`)
  return data
}

export async function getStandings(id: number): Promise<StandingEntry[]> {
  const { data } = await api.get<StandingEntry[]>(`/tournaments/${id}/standings`)
  return data
}

export async function getRounds(id: number): Promise<Round[]> {
  const { data } = await api.get<Round[]>(`/tournaments/${id}/rounds`)
  return data
}

export async function getStats(id: number): Promise<TournamentStats> {
  const { data } = await api.get<TournamentStats>(`/tournaments/${id}/stats`)
  return data
}

export async function getRegisteredTeams(id: number): Promise<Team[]> {
  const { data } = await api.get<Team[]>(`/tournaments/${id}/teams`)
  return data
}

export async function createTournament(input: NewTournamentData): Promise<Tournament> {
  const { data } = await api.post<Tournament>('/tournaments', input)
  return data
}
