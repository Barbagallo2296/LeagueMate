import { api } from './client'
import type { AssistantResponse, RoundRecap } from './types'

export async function getRecap(tournamentId: number, roundNumber: number): Promise<RoundRecap> {
  const { data } = await api.get<RoundRecap>(`/tournaments/${tournamentId}/rounds/${roundNumber}/recap`)
  return data
}

export async function regenerateRecap(tournamentId: number, roundNumber: number): Promise<void> {
  await api.post(`/tournaments/${tournamentId}/rounds/${roundNumber}/recap`)
}

export async function askAssistant(tournamentId: number, question: string): Promise<AssistantResponse> {
  const { data } = await api.post<AssistantResponse>(`/tournaments/${tournamentId}/assistant`, { question })
  return data
}
