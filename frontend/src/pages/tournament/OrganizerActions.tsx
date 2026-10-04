import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { errorMessage } from '../../api/client'
import { completeTournament, generateRounds } from '../../api/tournaments'
import type { Tournament } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import ErrorMessage from '../../components/ErrorMessage'

type PendingAction = 'generate' | 'complete' | null

export default function OrganizerActions({ tournament }: { tournament: Tournament }) {
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState<PendingAction>(null)

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournament.id] })
    queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  }

  const generate = useMutation({
    mutationFn: () => generateRounds(tournament.id),
    onSuccess: refresh,
    onSettled: () => setConfirming(null),
  })
  const complete = useMutation({
    mutationFn: () => completeTournament(tournament.id),
    onSuccess: refresh,
    onSettled: () => setConfirming(null),
  })
  const error = generate.error ?? complete.error

  if (tournament.status === 'COMPLETED') return null

  return (
    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-500">Gestione torneo:</span>
        {tournament.status === 'DRAFT' && (
          <button
            onClick={() => setConfirming('generate')}
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Genera calendario
          </button>
        )}
        {tournament.status === 'ACTIVE' && (
          <button
            onClick={() => setConfirming('complete')}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Chiudi torneo
          </button>
        )}
      </div>
      {error && <ErrorMessage message={errorMessage(error)} />}

      <ConfirmDialog
        open={confirming === 'generate'}
        title="Generare il calendario?"
        message="Le squadre iscritte verranno abbinate in giornate e il torneo passerà a In corso. Dopo non sarà più possibile iscrivere squadre."
        confirmLabel="Genera calendario"
        pending={generate.isPending}
        onConfirm={() => generate.mutate()}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === 'complete'}
        title="Chiudere il torneo?"
        message="Il torneo passerà a Concluso e non sarà più possibile modificare i risultati."
        confirmLabel="Chiudi torneo"
        pending={complete.isPending}
        onConfirm={() => complete.mutate()}
        onCancel={() => setConfirming(null)}
      />
    </div>
  )
}
