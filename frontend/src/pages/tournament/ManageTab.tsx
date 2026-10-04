import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { errorMessage } from '../../api/client'
import {
  completeTournament,
  generateRounds,
  getRegisteredTeams,
  getRounds,
  getStandings,
  getStats,
} from '../../api/tournaments'
import type { Round, Tournament } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { MatchRow } from './CalendarTab'
import { RegisterTeamForm } from './TeamsTab'

const STEPS = ['Iscrivi le squadre', 'Genera il calendario', 'Inserisci i risultati', 'Chiudi il torneo']

function currentStep(tournament: Tournament): number {
  if (tournament.status === 'DRAFT') return 0
  if (tournament.status === 'ACTIVE') return 2
  return STEPS.length
}

function Stepper({ tournament }: { tournament: Tournament }) {
  const step = currentStep(tournament)

  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {STEPS.map((label, index) => {
        const done = index < step
        const active = index === step || (step === 0 && index === 1)
        return (
          <li
            key={label}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              active ? 'border-lime/60 bg-panel shadow-card' : 'border-line bg-panel/50'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                done ? 'bg-lime text-on-lime' : active ? 'border-2 border-lime text-lime' : 'bg-raised text-muted'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className={`text-sm font-semibold ${done || active ? 'text-ink' : 'text-muted'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function useRefreshTournament(tournamentId: number) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    queryClient.invalidateQueries({ queryKey: ['tournaments'] })
  }
}

function DraftTools({ tournament }: { tournament: Tournament }) {
  const refresh = useRefreshTournament(tournament.id)
  const [confirming, setConfirming] = useState(false)
  const { data: teams } = useQuery({
    queryKey: ['tournament', tournament.id, 'teams'],
    queryFn: () => getRegisteredTeams(tournament.id),
  })
  const generate = useMutation({
    mutationFn: () => generateRounds(tournament.id),
    onSuccess: refresh,
    onSettled: () => setConfirming(false),
  })

  const count = teams?.length ?? 0
  const ready = count >= 2

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_480px] space-y-4">
        <RegisterTeamForm tournamentId={tournament.id} registeredIds={teams?.map((team) => team.id) ?? []} />
        {teams && teams.length > 0 && (
          <p className="text-sm text-muted">
            Iscritte: <span className="font-semibold text-reading">{teams.map((team) => team.name).join(', ')}</span>
          </p>
        )}
      </div>
      <div className="min-w-0 flex-[1_1_300px]">
        <Card title="Genera il calendario">
          <div className="space-y-4">
            <p className="font-display text-4xl font-bold">
              {count} <span className="text-base font-semibold text-muted">squadre iscritte</span>
            </p>
            <p className="text-sm leading-relaxed text-reading">
              {ready
                ? 'Le squadre verranno abbinate in giornate e il torneo passerà a In corso. Dopo non sarà più possibile iscrivere squadre.'
                : 'Servono almeno 2 squadre per generare il calendario.'}
            </p>
            {generate.error && <ErrorMessage message={errorMessage(generate.error)} />}
            <Button className="w-full" disabled={!ready} onClick={() => setConfirming(true)}>
              Genera calendario
            </Button>
          </div>
        </Card>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Generare il calendario?"
        message={`Le ${count} squadre iscritte verranno abbinate in giornate e il torneo passerà a In corso. Dopo non sarà più possibile iscrivere squadre.`}
        confirmLabel="Genera calendario"
        pending={generate.isPending}
        onConfirm={() => generate.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

function isCompleted(round: Round): boolean {
  return round.matches.every((match) => match.status === 'COMPLETED')
}

function ResultsTools({ tournament }: { tournament: Tournament }) {
  const refresh = useRefreshTournament(tournament.id)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const { data: rounds, isPending } = useQuery({
    queryKey: ['tournament', tournament.id, 'rounds'],
    queryFn: () => getRounds(tournament.id),
  })
  const { data: stats } = useQuery({
    queryKey: ['tournament', tournament.id, 'stats'],
    queryFn: () => getStats(tournament.id),
  })
  const complete = useMutation({
    mutationFn: () => completeTournament(tournament.id),
    onSuccess: refresh,
    onSettled: () => setConfirming(false),
  })

  if (isPending || !rounds) return <Spinner />

  const nextToPlay = rounds.find((round) => !isCompleted(round)) ?? rounds[rounds.length - 1]
  const roundNumber = selected ?? nextToPlay?.roundNumber
  const round = rounds.find((item) => item.roundNumber === roundNumber)
  const remaining = stats?.remainingMatches ?? 0

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_480px]">
        <Card title="Inserisci i risultati">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Scegli la giornata">
              {rounds.map((item) => {
                const isSelected = item.roundNumber === roundNumber
                const completed = isCompleted(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.roundNumber)}
                    aria-pressed={isSelected}
                    className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
                      isSelected
                        ? 'border-lime bg-lime text-on-lime'
                        : 'border-line text-reading hover:border-lime/60'
                    }`}
                  >
                    G{item.roundNumber}
                    {completed && <span aria-label="completata">✓</span>}
                  </button>
                )
              })}
            </div>
            {round && (
              <>
                <p className="text-sm text-muted">
                  Giornata {round.roundNumber}
                  {isCompleted(round) ? ' · completata: puoi correggere un risultato' : ' · da completare'}
                </p>
                <ul className="divide-y divide-line">
                  {round.matches.map((match) => (
                    <MatchRow key={match.id} match={match} tournamentId={tournament.id} editable />
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>
      </div>
      <div className="min-w-0 flex-[1_1_300px]">
        <Card title="Chiudi il torneo">
          <div className="space-y-4">
            <p className="font-display text-4xl font-bold">
              {remaining} <span className="text-base font-semibold text-muted">partite da giocare</span>
            </p>
            <p className="text-sm leading-relaxed text-reading">
              {remaining > 0
                ? 'Potrai chiudere il torneo quando tutte le partite avranno un risultato.'
                : 'Tutte le partite sono state giocate: puoi chiudere il torneo e proclamare il vincitore.'}
            </p>
            {complete.error && <ErrorMessage message={errorMessage(complete.error)} />}
            <Button className="w-full" disabled={remaining > 0} onClick={() => setConfirming(true)}>
              Chiudi torneo
            </Button>
          </div>
        </Card>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Chiudere il torneo?"
        message="Il torneo passerà a Concluso e non sarà più possibile modificare i risultati."
        confirmLabel="Chiudi torneo"
        pending={complete.isPending}
        onConfirm={() => complete.mutate()}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}

function CompletedSummary({ tournament }: { tournament: Tournament }) {
  const { data: standings } = useQuery({
    queryKey: ['tournament', tournament.id, 'standings'],
    queryFn: () => getStandings(tournament.id),
  })
  const winner = standings?.[0]

  return (
    <Card title="Torneo concluso">
      <p className="leading-relaxed text-reading">
        Il torneo è chiuso e i risultati non sono più modificabili.
        {winner && (
          <>
            {' '}
            Vincitore: <span className="font-bold text-lime">{winner.teamName}</span> con {winner.points} punti.
          </>
        )}
      </p>
    </Card>
  )
}

export default function ManageTab({ tournament }: { tournament: Tournament }) {
  return (
    <div className="space-y-6">
      <Stepper tournament={tournament} />
      {tournament.status === 'DRAFT' && <DraftTools tournament={tournament} />}
      {tournament.status === 'ACTIVE' && <ResultsTools tournament={tournament} />}
      {tournament.status === 'COMPLETED' && <CompletedSummary tournament={tournament} />}
    </div>
  )
}
