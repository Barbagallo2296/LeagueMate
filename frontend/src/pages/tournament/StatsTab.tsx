import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getStats } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

export default function StatsTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'stats'],
    queryFn: () => getStats(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  const progress = data.totalMatches > 0 ? Math.round((data.playedMatches / data.totalMatches) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow">
        <div className="mb-2 flex justify-between text-sm text-slate-600">
          <span>Partite giocate</span>
          <span>
            {data.playedMatches} su {data.totalMatches} ({progress}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-blue-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Squadre iscritte" value={data.registeredTeams} />
        <StatCard label="Partite da giocare" value={data.remainingMatches} />
        <StatCard label="Gol totali" value={data.totalGoals} />
        <StatCard label="Media gol a partita" value={data.averageGoalsPerMatch.toFixed(2)} />
        <StatCard
          label="Miglior attacco"
          value={data.topScoringTeam ? `${data.topScoringTeam} (${data.topScoringTeamGoals})` : '-'}
        />
      </div>
    </div>
  )
}
