import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/client'
import { updateMatchResult } from '../../api/matches'
import { getRounds } from '../../api/tournaments'
import type { Match } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'

interface MatchRowProps {
  match: Match
  tournamentId: number
  editable: boolean
}

const SCORE_INPUT =
  'h-9 w-12 rounded-lg border border-line bg-field text-center font-display text-lg font-bold text-ink focus:border-lime focus:outline-none'

export function MatchRow({ match, tournamentId, editable }: MatchRowProps) {
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

  return (
    <li className="py-3">
      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
        <span className="text-right font-semibold text-ink">{match.homeTeamName}</span>
        {editing ? (
          <span className="flex items-center gap-1.5 text-muted">
            <input
              type="number"
              min={0}
              required
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              className={SCORE_INPUT}
              aria-label={`Gol ${match.homeTeamName}`}
            />
            -
            <input
              type="number"
              min={0}
              required
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              className={SCORE_INPUT}
              aria-label={`Gol ${match.awayTeamName}`}
            />
          </span>
        ) : (
          <span
            className={`min-w-16 rounded-md px-2 py-0.5 text-center font-display text-lg font-bold ${
              played ? 'bg-score text-on-score' : 'border border-line text-muted'
            }`}
          >
            {played ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
          </span>
        )}
        <span className="font-semibold text-ink">{match.awayTeamName}</span>

        {editable && (
          <span className="col-span-3 flex justify-center gap-2">
            {editing ? (
              <>
                <Button type="submit" size="sm" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvataggio...' : 'Salva'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Annulla
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-lime hover:underline"
              >
                {played ? 'Modifica risultato' : 'Inserisci risultato'}
              </button>
            )}
          </span>
        )}
      </form>
      {mutation.error && (
        <div className="mt-2">
          <ErrorMessage message={errorMessage(mutation.error)} />
        </div>
      )}
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
    return (
      <p className="rounded-2xl border border-line bg-panel shadow-card p-6 text-reading">
        Il calendario non è ancora stato generato.
      </p>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {data.map((round) => {
        const completed = round.matches.every((match) => match.status === 'COMPLETED')
        return (
          <article key={round.id} className="rounded-2xl border border-line bg-panel shadow-card p-5">
            <header className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold uppercase tracking-wide">Giornata {round.roundNumber}</h3>
              {completed && (
                <span className="rounded-full bg-lime/15 px-2.5 py-0.5 text-xs font-bold text-lime">Completata</span>
              )}
            </header>
            <ul className="divide-y divide-line">
              {round.matches.map((match) => (
                <MatchRow key={match.id} match={match} tournamentId={tournamentId} editable={false} />
              ))}
            </ul>
          </article>
        )
      })}
    </div>
  )
}
