import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getStats } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'

function Tile({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-panel shadow-card p-4 ${wide ? 'col-span-2' : ''}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
    </div>
  )
}

export default function StatsTab({ tournamentId }: { tournamentId: number }) {
  const { data, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'stats'],
    queryFn: () => getStats(tournamentId),
  })

  if (error) return <ErrorMessage message={errorMessage(error)} />
  if (!data) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile label="Gol totali" value={data.totalGoals} />
      <Tile label="Media a partita" value={data.averageGoalsPerMatch.toFixed(2).replace('.', ',')} />
      <Tile label="Partite giocate" value={data.playedMatches} />
      <Tile label="Partite da giocare" value={data.remainingMatches} />
      <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-line bg-panel shadow-card p-4">
        <div>
          <p className="text-xs font-semibold text-muted">Miglior attacco</p>
          <p className="mt-1 font-bold text-ink">{data.topScoringTeam ?? 'Nessun gol ancora'}</p>
        </div>
        {data.topScoringTeam && (
          <p className="font-display text-3xl font-bold text-lime">
            {data.topScoringTeamGoals} <span className="text-base text-muted">gol</span>
          </p>
        )}
      </div>
    </div>
  )
}
