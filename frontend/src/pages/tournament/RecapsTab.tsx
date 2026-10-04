import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getRecap, regenerateRecap } from '../../api/ai'
import { errorMessage } from '../../api/client'
import { getRounds } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'

interface RecapCardProps {
  tournamentId: number
  tournamentName: string
  roundNumber: number
  canManage: boolean
  initiallyOpen: boolean
}

function RecapCard({ tournamentId, tournamentName, roundNumber, canManage, initiallyOpen }: RecapCardProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(initiallyOpen)
  const queryKey = ['tournament', tournamentId, 'recap', roundNumber]
  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: () => getRecap(tournamentId, roundNumber),
    enabled: open,
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  })

  const regenerate = useMutation({
    mutationFn: () => regenerateRecap(tournamentId, roundNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  if (!open) {
    return (
      <article className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-panel shadow-card px-6 py-4">
        <span className="font-semibold text-ink">
          Giornata {roundNumber} · {tournamentName}
        </span>
        <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-ai hover:underline">
          Leggi
        </button>
      </article>
    )
  }

  const status = data?.status

  return (
    <article className="space-y-4 rounded-2xl border border-line bg-panel shadow-card p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ai">Giornata {roundNumber}</p>
          <h3 className="mt-0.5 font-display text-3xl font-bold leading-tight">
            Giornata {roundNumber} · {tournamentName}
          </h3>
        </div>
        {canManage && status && status !== 'PENDING' && (
          <Button variant="ai" size="sm" onClick={() => regenerate.mutate()} disabled={regenerate.isPending}>
            {status === 'READY' ? 'Rigenera' : 'Genera cronaca'}
          </Button>
        )}
      </header>

      {isPending && <Spinner />}
      {error && <ErrorMessage message={errorMessage(error)} />}
      {regenerate.error && <ErrorMessage message={errorMessage(regenerate.error)} />}

      {status === 'PENDING' && (
        <p className="flex items-center gap-3 text-reading">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-ai-line border-t-ai" />
          L'AI sta scrivendo la cronaca...
        </p>
      )}
      {status === 'FAILED' && (
        <p className="text-reading">Non è stato possibile generare la cronaca. Riprova più tardi.</p>
      )}
      {status === 'NOT_AVAILABLE' && <p className="text-reading">Cronaca non ancora disponibile.</p>}
      {status === 'READY' && data?.content && (
        <>
          <div className="space-y-4 text-base leading-relaxed text-reading">
            {data.content.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {data.generatedAt && (
            <p className="border-t border-line pt-3 text-xs text-muted">
              Scritta da {data.model} il{' '}
              {new Date(data.generatedAt).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </>
      )}
    </article>
  )
}

interface RecapsTabProps {
  tournamentId: number
  tournamentName: string
  canManage: boolean
}

export default function RecapsTab({ tournamentId, tournamentName, canManage }: RecapsTabProps) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'rounds'],
    queryFn: () => getRounds(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  const completedRounds = data
    .filter((round) => round.matches.every((match) => match.status === 'COMPLETED'))
    .reverse()

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Cronache delle giornate</h2>
        <span className="text-sm text-muted">Scritte dall'AI a fine giornata</span>
      </div>
      {completedRounds.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel shadow-card p-6 text-reading">
          Le cronache compaiono quando una giornata è completa.
        </p>
      ) : (
        completedRounds.map((round, index) => (
          <RecapCard
            key={round.id}
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            roundNumber={round.roundNumber}
            canManage={canManage}
            initiallyOpen={index === 0}
          />
        ))
      )}
    </section>
  )
}
