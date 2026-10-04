import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '../api/client'
import { getTournaments } from '../api/tournaments'
import type { TournamentStatus } from '../api/types'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'

const FILTERS: { label: string; value?: TournamentStatus }[] = [
  { label: 'Tutti' },
  { label: 'Bozza', value: 'DRAFT' },
  { label: 'In corso', value: 'ACTIVE' },
  { label: 'Conclusi', value: 'COMPLETED' },
]

export default function TournamentsPage() {
  const { canOrganize } = useAuth()
  const [status, setStatus] = useState<TournamentStatus | undefined>()
  const { data, isPending, error } = useQuery({
    queryKey: ['tournaments', status],
    queryFn: () => getTournaments(status),
  })

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tornei</h1>
        {canOrganize && (
          <Link
            to="/tournaments/new"
            className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
          >
            Nuovo torneo
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              status === filter.value
                ? 'bg-blue-700 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isPending && <Spinner />}
      {error && <ErrorMessage message={errorMessage(error)} />}
      {data && data.length === 0 && <p className="text-slate-600">Nessun torneo trovato.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tournaments/${tournament.id}`}
            className="rounded-xl bg-white p-5 shadow transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-800">{tournament.name}</h2>
              <StatusBadge status={tournament.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Stagione {tournament.season} · {tournament.doubleRoundRobin ? 'Andata e ritorno' : 'Solo andata'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
