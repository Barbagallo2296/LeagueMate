import { api } from './client'
import type { Match } from './types'

export async function updateMatchResult(matchId: number, homeScore: number, awayScore: number): Promise<Match> {
  const { data } = await api.put<Match>(`/matches/${matchId}/result`, { homeScore, awayScore })
  return data
}
