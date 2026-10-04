import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/client'
import { createTeam, getTeams } from '../../api/teams'
import { getRegisteredTeams, registerTeam } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { teamInitials } from '../../utils/teams'

const FIELD =
  'h-11 min-w-0 flex-1 rounded-lg border border-line bg-field px-3 text-ink placeholder:text-muted focus:border-lime focus:outline-none'

interface RegisterTeamFormProps {
  tournamentId: number
  registeredIds: number[]
}

export function RegisterTeamForm({ tournamentId, registeredIds }: RegisterTeamFormProps) {
  const queryClient = useQueryClient()
  const [teamId, setTeamId] = useState('')
  const [newTeamName, setNewTeamName] = useState('')
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: getTeams })
  const availableTeams = teams?.filter((team) => !registeredIds.includes(team.id)) ?? []

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
  }

  const registerExisting = useMutation({
    mutationFn: (id: number) => registerTeam(tournamentId, id),
    onSuccess: () => {
      setTeamId('')
      refresh()
    },
  })

  const createAndRegister = useMutation({
    mutationFn: async (name: string) => {
      const team = await createTeam(name)
      await registerTeam(tournamentId, team.id)
    },
    onSuccess: () => {
      setNewTeamName('')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      refresh()
    },
  })

  function handleRegister(event: FormEvent) {
    event.preventDefault()
    registerExisting.mutate(Number(teamId))
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    createAndRegister.mutate(newTeamName.trim())
  }

  const error = registerExisting.error ?? createAndRegister.error

  return (
    <Card title="Iscrivi una squadra">
      <div className="space-y-3">
        {error && <ErrorMessage message={errorMessage(error)} />}
        <form onSubmit={handleRegister} className="flex flex-wrap gap-2">
          <select
            required
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className={FIELD}
            aria-label="Squadra esistente"
          >
            <option value="">Scegli una squadra esistente...</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="lg" disabled={registerExisting.isPending}>
            Iscrivi
          </Button>
        </form>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <input
            required
            minLength={2}
            maxLength={50}
            value={newTeamName}
            onChange={(event) => setNewTeamName(event.target.value)}
            placeholder="Oppure crea una nuova squadra"
            className={FIELD}
            aria-label="Nome della nuova squadra"
          />
          <Button type="submit" variant="secondary" size="lg" disabled={createAndRegister.isPending}>
            Crea e iscrivi
          </Button>
        </form>
      </div>
    </Card>
  )
}

export default function TeamsTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'teams'],
    queryFn: () => getRegisteredTeams(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide">Squadre iscritte</h2>
        <span className="text-sm text-muted">{data.length} squadre</span>
      </div>
      {data.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel shadow-card p-6 text-reading">Nessuna squadra iscritta.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((team) => (
            <li key={team.id} className="flex items-center gap-3 rounded-2xl border border-line bg-panel shadow-card p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-raised font-bold text-lime">
                {teamInitials(team.name)}
              </span>
              <span className="font-semibold text-ink">{team.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
