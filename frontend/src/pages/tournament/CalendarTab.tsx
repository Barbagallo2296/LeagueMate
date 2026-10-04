import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getRounds } from '../../api/tournaments'
import type { Match } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

function MatchRow({ match }: { match: Match }) {
  const played = match.status === 'COMPLETED'

  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
      <span className="text-right font-medium text-slate-800">{match.homeTeamName}</span>
      <span
        className={`min-w-16 rounded-lg px-2 py-1 text-center font-bold ${
          played ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
        }`}
      >
        {played ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
      </span>
      <span className="font-medium text-slate-800">{match.awayTeamName}</span>
    </li>
  )
}

export default function CalendarTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'rounds'],
    queryFn: () => getRounds(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />
  if (data.length === 0) {
    return <p className="text-slate-600">Il calendario non è ancora stato generato.</p>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((round) => {
        const completed = round.matches.every((match) => match.status === 'COMPLETED')
        return (
          <article key={round.id} className="rounded-xl bg-white p-4 shadow">
            <header className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Giornata {round.roundNumber}</h3>
              {completed && <span className="text-xs font-medium text-green-700">Completata</span>}
            </header>
            <ul className="divide-y divide-slate-100 text-sm">
              {round.matches.map((match) => (
                <MatchRow key={match.id} match={match} />
              ))}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
