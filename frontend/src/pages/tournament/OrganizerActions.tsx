import { useMutation, useQueryClient } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { completeTournament, generateRounds } from '../../api/tournaments'
import type { Tournament } from '../../api/types'
import ErrorMessage from '../../components/ErrorMessage'

export default function OrganizerActions({ tournament }: { tournament: Tournament }) {
  const queryClient = useQueryClient()

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] })
    queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  }

  const generate = useMutation({ mutationFn: () => generateRounds(tournament.id), onSuccess: refresh })
  const complete = useMutation({ mutationFn: () => completeTournament(tournament.id), onSuccess: refresh })
  const error = generate.error ?? complete.error

  if (tournament.status === 'COMPLETED') return null

  return (
    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Gestione torneo:</span>
        {tournament.status === 'DRAFT' && (
          <button
            onClick={() => {
              if (confirm('Generare il calendario? Dopo non sarà più possibile iscrivere squadre.')) {
                generate.mutate()
              }
            }}
            disabled={generate.isPending}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {generate.isPending ? 'Generazione...' : 'Genera calendario'}
          </button>
        )}
        {tournament.status === 'ACTIVE' && (
          <button
            onClick={() => {
              if (confirm('Chiudere il torneo? Non sarà più possibile modificare i risultati.')) {
                complete.mutate()
              }
            }}
            disabled={complete.isPending}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {complete.isPending ? 'Chiusura...' : 'Chiudi torneo'}
          </button>
        )}
      </div>
      {error && <ErrorMessage message={errorMessage(error)} />}
    </div>
  )
}
