import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRecap, regenerateRecap } from '../../api/ai'
import { errorMessage } from '../../api/client'
import { getRounds } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

interface RecapCardProps {
  tournamentId: number
  tournamentName: string
  roundNumber: number
  canManage: boolean
}

function RecapCard({ tournamentId, tournamentName, roundNumber, canManage }: RecapCardProps) {
  const queryClient = useQueryClient()
  const queryKey = ['tournament', tournamentId, 'recap', roundNumber]
  const { data, isPending, error } = useQuery({
    queryKey,
    queryFn: () => getRecap(tournamentId, roundNumber),
    refetchInterval: (query) => (query.state.data?.status === 'PENDING' ? 3000 : false),
  })

  const regenerate = useMutation({
    mutationFn: () => regenerateRecap(tournamentId, roundNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const status = data?.status

  return (
    <article className="rounded-xl bg-white p-5 shadow">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-800">
          Giornata {roundNumber} · {tournamentName}
        </h3>
        {canManage && status !== 'PENDING' && (
          <button
            onClick={() => regenerate.mutate()}
            disabled={regenerate.isPending}
            className="rounded-lg border border-blue-700 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            {status === 'READY' ? 'Rigenera' : 'Genera cronaca'}
          </button>
        )}
      </header>

      {isPending && <Spinner />}
      {error && <ErrorMessage message={errorMessage(error)} />}
      {regenerate.error && <ErrorMessage message={errorMessage(regenerate.error)} />}

      {status === 'PENDING' && (
        <p className="flex items-center gap-2 text-slate-600">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          L'AI sta scrivendo la cronaca...
        </p>
      )}
      {status === 'FAILED' && (
        <p className="text-slate-600">Non è stato possibile generare la cronaca. Riprova più tardi.</p>
      )}
      {status === 'NOT_AVAILABLE' && <p className="text-slate-600">Cronaca non disponibile.</p>}
      {status === 'READY' && data?.content && (
        <>
          <div className="space-y-3 leading-relaxed text-slate-700">
            {data.content.split(/\n\s*\n/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          {data.generatedAt && (
            <p className="mt-3 text-xs text-slate-400">
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

  if (completedRounds.length === 0) {
    return <p className="text-slate-600">Le cronache compaiono quando una giornata è completa.</p>
  }

  return (
    <div className="space-y-4">
      {completedRounds.map((round) => (
        <RecapCard
          key={round.id}
          tournamentId={tournamentId}
          tournamentName={tournamentName}
          roundNumber={round.roundNumber}
          canManage={canManage}
        />
      ))}
    </div>
  )
}
