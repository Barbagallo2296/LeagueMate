import { useQueries } from '@tanstack/react-query'
import { getRounds } from '../../api/tournaments'
import type { Round, Tournament } from '../../api/types'

export interface TournamentRounds {
  tournament: Tournament
  rounds: Round[] | undefined
}

export function isCompleted(round: Round): boolean {
  return round.matches.every((match) => match.status === 'COMPLETED')
}

function playedMatches(rounds: Round[] | undefined): number {
  return rounds?.flatMap((round) => round.matches).filter((match) => match.status === 'COMPLETED').length ?? 0
}

export function useStartedTournaments(tournaments: Tournament[]): TournamentRounds[] {
  const started = tournaments.filter((tournament) => tournament.status !== 'DRAFT')
  const queries = useQueries({
    queries: started.map((tournament) => ({
      queryKey: ['tournament', tournament.id, 'rounds'],
      queryFn: () => getRounds(tournament.id),
    })),
  })
  return started
    .map((tournament, index) => ({ tournament, rounds: queries[index]?.data }))
    .sort((a, b) => playedMatches(b.rounds) - playedMatches(a.rounds))
}
