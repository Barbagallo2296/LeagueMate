import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { errorMessage } from '../api/client'
import { getTournament } from '../api/tournaments'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import CalendarTab from './tournament/CalendarTab'
import OrganizerActions from './tournament/OrganizerActions'
import StandingsTab from './tournament/StandingsTab'
import StatsTab from './tournament/StatsTab'
import TeamsTab from './tournament/TeamsTab'
import { useCanManage } from './tournament/useCanManage'

const TABS = [
  { key: 'standings', label: 'Classifica' },
  { key: 'calendar', label: 'Calendario' },
  { key: 'stats', label: 'Statistiche' },
  { key: 'teams', label: 'Squadre' },
] as const

type TabKey = (typeof TABS)[number]['key']

export default function TournamentDetailPage() {
  const tournamentId = Number(useParams().id)
  const [tab, setTab] = useState<TabKey>('standings')
  const canManage = useCanManage(tournamentId)
  const { data: tournament, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => getTournament(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={errorMessage(error)} />
        <Link to="/" className="text-blue-700 hover:underline">
          Torna ai tornei
        </Link>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-xl bg-white p-6 shadow">
        <Link to="/" className="text-sm text-blue-700 hover:underline">
          ← Tutti i tornei
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">{tournament.name}</h1>
          <StatusBadge status={tournament.status} />
        </div>
        <p className="mt-1 text-slate-600">
          Stagione {tournament.season} · {tournament.doubleRoundRobin ? 'Andata e ritorno' : 'Solo andata'} ·{' '}
          {tournament.pointsForWin} punti a vittoria, {tournament.pointsForDraw} a pareggio
        </p>
        {canManage && <OrganizerActions tournament={tournament} />}
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`-mb-px border-b-2 px-4 py-2 font-medium ${
              tab === item.key
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'standings' && <StandingsTab tournamentId={tournamentId} />}
      {tab === 'calendar' && (
        <CalendarTab tournamentId={tournamentId} editable={canManage && tournament.status === 'ACTIVE'} />
      )}
      {tab === 'stats' && <StatsTab tournamentId={tournamentId} />}
      {tab === 'teams' && (
        <TeamsTab tournamentId={tournamentId} canRegister={canManage && tournament.status === 'DRAFT'} />
      )}
    </section>
  )
}
