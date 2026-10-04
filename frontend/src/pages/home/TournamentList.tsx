import { Link } from 'react-router'
import type { Tournament, TournamentStatus } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { TrophyIcon } from './TournamentCard'
import { useTournamentSummary } from './useTournamentSummary'

const STATUS_BAR: Record<TournamentStatus, string> = {
  ACTIVE: 'bg-lime',
  DRAFT: 'bg-warn',
  COMPLETED: 'bg-closed',
}

function TournamentRow({ tournament }: { tournament: Tournament }) {
  const { stats, percent, leader } = useTournamentSummary(tournament)
  const isDraft = tournament.status === 'DRAFT'

  return (
    <li>
      <Link
        to={`/tornei/${tournament.id}`}
        className="grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-raised/50 md:grid-cols-[6px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]"
      >
        <span className={`h-9 rounded-full ${STATUS_BAR[tournament.status]}`} />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate font-semibold text-ink">{tournament.name}</span>
            <span className="md:hidden">
              <StatusBadge status={tournament.status} />
            </span>
          </span>
          <span className="block truncate text-xs text-muted">
            Stagione {tournament.season}
            {stats && ` · ${stats.registeredTeams} squadre`}
          </span>
        </span>
        <span className="hidden items-center gap-2 text-sm text-reading md:flex">
          {isDraft || !stats ? (
            <StatusBadge status={tournament.status} />
          ) : (
            <>
              <span className="h-1.5 flex-1 rounded-full bg-track">
                <span className="block h-1.5 rounded-full bg-lime" style={{ width: `${percent}%` }} />
              </span>
              <span className="whitespace-nowrap">
                {stats.playedMatches}/{stats.totalMatches}
              </span>
            </>
          )}
        </span>
        <span className="hidden min-w-0 text-sm md:block">
          {isDraft ? (
            <span className="text-muted">In attesa del calendario</span>
          ) : leader ? (
            <span
              className="flex min-w-0 items-center gap-1.5"
              title={tournament.status === 'COMPLETED' ? 'Vincitore' : 'Capolista'}
            >
              <span className="shrink-0 text-lime">
                <TrophyIcon />
              </span>
              <span className="truncate font-semibold text-ink">{leader.teamName}</span>
              <span className="shrink-0 text-muted">{leader.points} pt</span>
            </span>
          ) : (
            <span className="text-muted">Nessuna partita giocata</span>
          )}
        </span>
        <span className="text-sm font-bold text-lime">Apri →</span>
      </Link>
    </li>
  )
}

export default function TournamentList({ tournaments }: { tournaments: Tournament[] }) {
  return (
    <ul className="divide-y divide-line">
      {tournaments.map((tournament) => (
        <TournamentRow key={tournament.id} tournament={tournament} />
      ))}
    </ul>
  )
}
