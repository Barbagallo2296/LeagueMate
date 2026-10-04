import { useOutletContext } from 'react-router'
import type { Tournament } from '../../api/types'

export interface TournamentContext {
  tournament: Tournament
  canManage: boolean
}

export function useTournament(): TournamentContext {
  return useOutletContext<TournamentContext>()
}
