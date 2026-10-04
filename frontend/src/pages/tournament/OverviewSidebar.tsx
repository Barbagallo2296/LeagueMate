import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getRounds } from '../../api/tournaments'
import Card from '../../components/ui/Card'

export default function OverviewSidebar({ tournamentId }: { tournamentId: number }) {
  const { data: rounds } = useQuery({
    queryKey: ['tournament', tournamentId, 'rounds'],
    queryFn: () => getRounds(tournamentId),
  })

  if (!rounds || rounds.length === 0) return null

  const next = rounds.find((round) => round.matches.some((match) => match.status !== 'COMPLETED'))

  if (!next) {
    return (
      <Card title="Calendario completato">
        <p className="text-sm leading-relaxed text-reading">
          Tutte le {rounds.length} giornate sono state giocate.{' '}
          <Link to={`/tornei/${tournamentId}/calendario`} className="font-semibold text-lime hover:underline">
            Rivedi il calendario
          </Link>
        </p>
      </Card>
    )
  }

  const toPlay = next.matches.filter((match) => match.status !== 'COMPLETED')

  return (
    <Card
      title={`Giornata ${next.roundNumber}`}
      actions={
        <Link to={`/tornei/${tournamentId}/calendario`} className="text-sm font-semibold text-lime hover:underline">
          Calendario
        </Link>
      }
    >
      <p className="-mt-2 mb-3 text-xs font-bold uppercase tracking-wide text-muted">
        Prossima giornata · {toPlay.length} {toPlay.length === 1 ? 'partita' : 'partite'} da giocare
      </p>
      <ul className="divide-y divide-line">
        {next.matches.map((match) => {
          const played = match.status === 'COMPLETED'
          return (
            <li key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 text-sm font-semibold">
              <span className="text-right">{match.homeTeamName}</span>
              <span
                className={`min-w-14 rounded-md px-2 py-0.5 text-center font-display text-lg font-bold ${
                  played ? 'bg-score text-on-score' : 'border border-line text-muted'
                }`}
              >
                {played ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
              </span>
              <span>{match.awayTeamName}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
