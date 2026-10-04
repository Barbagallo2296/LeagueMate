import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/client'
import { updateMatchResult } from '../../api/matches'
import { getRounds } from '../../api/tournaments'
import type { Match } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

interface MatchRowProps {
  match: Match
  tournamentId: number
  editable: boolean
}

function MatchRow({ match, tournamentId, editable }: MatchRowProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '')
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '')
  const played = match.status === 'COMPLETED'

  const mutation = useMutation({
    mutationFn: () => updateMatchResult(match.id, Number(homeScore), Number(awayScore)),
    onSuccess: () => {
      setEditing(false)
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  const scoreInput = 'w-14 rounded-lg border border-slate-300 px-2 py-1 text-center'

  return (
    <li className="py-2">
      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3">
        <span className="text-right font-medium text-slate-800">{match.homeTeamName}</span>
        {editing ? (
          <span className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              required
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              className={scoreInput}
              aria-label={`Gol ${match.homeTeamName}`}
            />
            -
            <input
              type="number"
              min={0}
              required
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              className={scoreInput}
              aria-label={`Gol ${match.awayTeamName}`}
            />
          </span>
        ) : (
          <span
            className={`min-w-16 rounded-lg px-2 py-1 text-center font-bold ${
              played ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {played ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
          </span>
        )}
        <span className="font-medium text-slate-800">{match.awayTeamName}</span>
        <span className="flex gap-2 text-sm">
          {editable && !editing && (
            <button type="button" onClick={() => setEditing(true)} className="text-blue-700 hover:underline">
              {played ? 'Modifica' : 'Risultato'}
            </button>
          )}
          {editing && (
            <>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="font-semibold text-green-700 hover:underline disabled:opacity-50"
              >
                Salva
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-slate-500 hover:underline">
                Annulla
              </button>
            </>
          )}
        </span>
      </form>
      {mutation.error && (
        <div className="mt-2">
          <ErrorMessage message={errorMessage(mutation.error)} />
        </div>
      )}
    </li>
  )
}

interface CalendarTabProps {
  tournamentId: number
  editable: boolean
}

export default function CalendarTab({ tournamentId, editable }: CalendarTabProps) {
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
    <div className="grid gap-4 lg:grid-cols-2">
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
                <MatchRow key={match.id} match={match} tournamentId={tournamentId} editable={editable} />
              ))}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
