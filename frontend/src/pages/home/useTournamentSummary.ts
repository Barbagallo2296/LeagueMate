import { useQuery } from '@tanstack/react-query'
import { getStandings, getStats } from '../../api/tournaments'
import type { StandingEntry, Tournament, TournamentStats } from '../../api/types'

export interface TournamentSummary {
  stats: TournamentStats | undefined
  percent: number
  leader: StandingEntry | undefined
  started: boolean
}

export function useTournamentSummary(tournament: Tournament): TournamentSummary {
  const { data: stats } = useQuery({
    queryKey: ['tournament', tournament.id, 'stats'],
    queryFn: () => getStats(tournament.id),
  })
  const { data: standings } = useQuery({
    queryKey: ['tournament', tournament.id, 'standings'],
    queryFn: () => getStandings(tournament.id),
    enabled: tournament.status !== 'DRAFT',
  })

  const percent = stats && stats.totalMatches > 0 ? Math.round((stats.playedMatches / stats.totalMatches) * 100) : 0
  const started = standings?.some((entry) => entry.wins + entry.draws + entry.losses > 0) ?? false

  return { stats, percent, leader: started ? standings?.[0] : undefined, started }
}
