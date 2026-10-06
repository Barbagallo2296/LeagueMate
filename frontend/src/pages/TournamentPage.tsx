import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useParams } from 'react-router'
import { errorMessage } from '../api/client'
import { getStats, getTournament } from '../api/tournaments'
import type { Tournament } from '../api/types'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { buttonClasses } from '../components/ui/buttonStyles'
import Tabs from '../components/ui/Tabs'
import type { TournamentContext } from './tournament/tournamentContext'
import { useCanManage } from './tournament/useCanManage'

function Progress({ tournament }: { tournament: Tournament }) {
  const { data: stats } = useQuery({
    queryKey: ['tournament', tournament.id, 'stats'],
    queryFn: () => getStats(tournament.id),
  })

  if (!stats) return null

  if (tournament.status === 'DRAFT') {
    return (
      <p className="text-sm text-hero-muted">
        <span className="font-display text-2xl font-semibold text-on-hero">{stats.registeredTeams}</span> squadre iscritte
      </p>
    )
  }

  const percent = stats.totalMatches > 0 ? Math.round((stats.playedMatches / stats.totalMatches) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4 text-sm text-hero-muted">
        <span>Partite giocate</span>
        <span className="font-display text-2xl font-semibold text-on-hero">
          {stats.playedMatches} / {stats.totalMatches}
        </span>
      </div>
      <div className="h-2 rounded-full bg-hero-track">
        <div className="h-2 rounded-full bg-hero-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default function TournamentPage() {
  const tournamentId = Number(useParams().id)
  const { canManage, checking } = useCanManage(tournamentId)
  const { data: tournament, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId),
  })

  if (isPending || checking) return <Spinner />
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={errorMessage(error)} />
        <Link to="/" className="font-semibold text-lime hover:underline">
          Torna ai tornei
        </Link>
      </div>
    )
  }

  const base = `/tornei/${tournament.id}`
  const context: TournamentContext = { tournament, canManage }

  return (
    <section className="space-y-6">
      <nav className="flex gap-2 text-sm text-muted" aria-label="Percorso">
        <Link to="/" className="hover:text-ink">
          Tornei
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{tournament.name}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-6 rounded-2xl bg-hero p-6 text-on-hero sm:p-8">
        <div className="min-w-0 flex-[1_1_380px] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={tournament.status} />
            <span className="text-sm text-hero-muted">Stagione {tournament.season}</span>
          </div>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl">
            {tournament.name}
          </h1>
          <p className="text-sm text-hero-muted">
            {tournament.doubleRoundRobin ? 'Andata e ritorno' : 'Solo andata'} · {tournament.pointsForWin} punti a
            vittoria, {tournament.pointsForDraw} a pareggio
          </p>
        </div>
        <div className="w-full space-y-4 sm:w-80">
          <Progress tournament={tournament} />
          {canManage && tournament.status !== 'COMPLETED' && (
            <div className="flex justify-end">
              <Link to={`${base}/gestione`} className={buttonClasses('primary')}>
                Gestisci torneo
              </Link>
            </div>
          )}
        </div>
      </header>

      <Tabs
        items={[
          { to: base, label: 'Panoramica', end: true },
          { to: `${base}/calendario`, label: 'Calendario' },
          { to: `${base}/squadre`, label: 'Squadre' },
          { to: `${base}/ai`, label: 'Cronache e assistente', ai: true },
          ...(canManage ? [{ to: `${base}/gestione`, label: 'Gestione' }] : []),
        ]}
      />

      <Outlet context={context} />
    </section>
  )
}
