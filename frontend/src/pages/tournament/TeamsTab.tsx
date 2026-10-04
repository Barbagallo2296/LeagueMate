import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getRegisteredTeams } from '../../api/tournaments'
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

export default function TeamsTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'teams'],
    queryFn: () => getRegisteredTeams(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />
  if (data.length === 0) return <p className="text-slate-600">Nessuna squadra iscritta.</p>

  return (
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
  )
}
