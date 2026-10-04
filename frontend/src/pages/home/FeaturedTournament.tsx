import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getRecap } from '../../api/ai'
import { getRounds, getStandings } from '../../api/tournaments'
import type { Tournament, TournamentStats } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { isCompleted } from './homeData'

const BOX = 'rounded-xl bg-white/5 p-4'
const BOX_TITLE = 'text-xs font-bold uppercase tracking-wide text-hero-muted'

function RecapLine({ tournamentId, roundNumber }: { tournamentId: number; roundNumber: number }) {
  const { data } = useQuery({
    queryKey: ['tournament', tournamentId, 'recap', roundNumber],
    queryFn: () => getRecap(tournamentId, roundNumber),
  })

  return (
    <Link to={`/tornei/${tournamentId}/ai`} className="flex min-w-0 flex-1 items-center gap-3">
      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-hero-ai">✦ Cronaca AI</span>
      <span className="truncate text-sm text-on-hero/80">
        {data?.status === 'READY' && data.content ? data.content : 'La cronaca comparirà a fine giornata.'}
      </span>
    </Link>
  )
}

interface FeaturedTournamentProps {
  tournament: Tournament
  stats: TournamentStats
}

export default function FeaturedTournament({ tournament, stats }: FeaturedTournamentProps) {
  const { data: standings } = useQuery({
    queryKey: ['tournament', tournament.id, 'standings'],
    queryFn: () => getStandings(tournament.id),
  })
  const { data: rounds } = useQuery({
    queryKey: ['tournament', tournament.id, 'rounds'],
    queryFn: () => getRounds(tournament.id),
  })

  const lastRound = rounds?.slice().reverse().find(isCompleted)
  const percent = stats.totalMatches > 0 ? Math.round((stats.playedMatches / stats.totalMatches) * 100) : 0

  return (
    <section className="space-y-5 rounded-2xl bg-hero p-6 text-on-hero">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-widest text-hero-accent">In evidenza</p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-4xl font-bold uppercase leading-none tracking-wide">{tournament.name}</h2>
            <StatusBadge status={tournament.status} />
          </div>
        </div>
        <div className="w-full space-y-2 sm:w-64">
          <div className="flex justify-between text-sm text-hero-muted">
            <span>Partite giocate</span>
            <span className="font-bold text-on-hero">
              {stats.playedMatches} / {stats.totalMatches}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-hero-track">
            <div className="h-1.5 rounded-full bg-hero-accent" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={BOX}>
          <p className={BOX_TITLE}>Podio</p>
          <ol className="mt-3 space-y-2.5">
            {standings?.slice(0, 3).map((entry, index) => (
              <li key={entry.teamName} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    index === 0 ? 'bg-hero-accent text-hero' : 'bg-hero-track text-on-hero'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{entry.teamName}</span>
                <span className="font-display text-xl font-bold">{entry.points}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className={BOX}>
          <p className={BOX_TITLE}>{lastRound ? `Giornata ${lastRound.roundNumber}` : 'Ultima giornata'}</p>
          {lastRound ? (
            <ul className="mt-3 space-y-2">
              {lastRound.matches.map((match) => (
                <li key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                  <span className="truncate text-right">{match.homeTeamName}</span>
                  <span className="rounded-md bg-hero-track px-2 font-display text-base font-bold">
                    {match.homeScore} - {match.awayScore}
                  </span>
                  <span className="truncate">{match.awayTeamName}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-hero-muted">Nessuna giornata ancora completata.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
        {lastRound ? (
          <RecapLine tournamentId={tournament.id} roundNumber={lastRound.roundNumber} />
        ) : (
          <span className="flex-1" />
        )}
        <Link to={`/tornei/${tournament.id}`} className={buttonClasses('primary', 'md', 'shrink-0')}>
          Apri il torneo →
        </Link>
      </div>
    </section>
  )
}
