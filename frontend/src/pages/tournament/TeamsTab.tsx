import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { errorMessage } from '../../api/client'
import { createTeam, getTeams } from '../../api/teams'
import { getRegisteredTeams, registerTeam } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface RegisterTeamFormProps {
  tournamentId: number
  registeredIds: number[]
}

function RegisterTeamForm({ tournamentId, registeredIds }: RegisterTeamFormProps) {
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
  const fieldClass = 'flex-1 rounded-lg border border-slate-300 px-3 py-2'
  const buttonClass =
    'rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50'

  return (
    <div className="space-y-3 rounded-xl bg-white p-4 shadow">
      <h3 className="font-semibold text-slate-800">Iscrivi una squadra</h3>
      {error && <ErrorMessage message={errorMessage(error)} />}
      <form onSubmit={handleRegister} className="flex flex-wrap gap-2">
        <select required value={teamId} onChange={(event) => setTeamId(event.target.value)} className={fieldClass}>
          <option value="">Scegli una squadra esistente...</option>
          {availableTeams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={registerExisting.isPending} className={buttonClass}>
          Iscrivi
        </button>
      </form>
      <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
        <input
          required
          minLength={2}
          maxLength={50}
          value={newTeamName}
          onChange={(event) => setNewTeamName(event.target.value)}
          placeholder="Oppure crea una nuova squadra"
          className={fieldClass}
        />
        <button type="submit" disabled={createAndRegister.isPending} className={buttonClass}>
          Crea e iscrivi
        </button>
      </form>
    </div>
  )
}

interface TeamsTabProps {
  tournamentId: number
  canRegister: boolean
}

export default function TeamsTab({ tournamentId, canRegister }: TeamsTabProps) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'teams'],
    queryFn: () => getRegisteredTeams(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  return (
    <div className="space-y-4">
      {canRegister && (
        <RegisterTeamForm tournamentId={tournamentId} registeredIds={data.map((team) => team.id)} />
      )}
      {data.length === 0 && <p className="text-slate-600">Nessuna squadra iscritta.</p>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((team) => (
          <li key={team.id} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {initials(team.name)}
            </span>
            <span className="font-medium text-slate-800">{team.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
