import { Link } from 'react-router'
import type { Tournament, TournamentStatus } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { useTournamentSummary } from './useTournamentSummary'

const STATUS_BAR: Record<TournamentStatus, string> = {
  ACTIVE: 'border-t-lime',
  DRAFT: 'border-t-warn',
  COMPLETED: 'border-t-closed',
}

export function TrophyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 6h3v2a3 3 0 0 1-3 3M7 6H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const { stats, percent, leader } = useTournamentSummary(tournament)
  const isDraft = tournament.status === 'DRAFT'

  return (
    <Link
      to={`/tornei/${tournament.id}`}
      className={`flex flex-col gap-3 rounded-2xl border border-t-4 border-line bg-panel px-5 py-4 shadow-card transition-colors hover:bg-raised/40 ${STATUS_BAR[tournament.status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide text-ink">
          {tournament.name}
        </span>
        <StatusBadge status={tournament.status} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="whitespace-nowrap">
          {tournament.season}
          {stats && ` · ${stats.registeredTeams} squadre`}
        </span>
        {!isDraft && stats && (
          <>
            <span className="h-1.5 flex-1 rounded-full bg-track">
              <span className="block h-1.5 rounded-full bg-lime" style={{ width: `${percent}%` }} />
            </span>
            <span className="whitespace-nowrap font-semibold text-reading">
              {stats.playedMatches}/{stats.totalMatches}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        {isDraft ? (
          <span className="text-muted">In attesa del calendario</span>
        ) : leader ? (
          <span className="flex min-w-0 items-center gap-1.5 text-reading">
            <span className="shrink-0 text-lime">
              <TrophyIcon />
            </span>
            <span className="truncate font-bold text-ink">{leader.teamName}</span>
            <span className="shrink-0 text-muted">{leader.points} pt</span>
          </span>
        ) : (
          <span className="text-muted">Nessuna partita giocata</span>
        )}
        <span className="shrink-0 font-bold text-lime">Apri →</span>
      </div>
    </Link>
  )
}
