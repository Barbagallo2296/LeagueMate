import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getStandings } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

export default function StandingsTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'standings'],
    queryFn: () => getStandings(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />
  if (data.length === 0) return <p className="text-slate-600">Nessuna squadra iscritta.</p>

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Squadra</th>
            <th className="px-3 py-2 text-center">Pt</th>
            <th className="px-3 py-2 text-center">V</th>
            <th className="px-3 py-2 text-center">N</th>
            <th className="px-3 py-2 text-center">P</th>
            <th className="px-3 py-2 text-center">GF</th>
            <th className="px-3 py-2 text-center">GS</th>
            <th className="px-3 py-2 text-center">DR</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={entry.teamName} className="border-t border-slate-100">
              <td className="px-3 py-2 text-slate-500">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-slate-800">{entry.teamName}</td>
              <td className="px-3 py-2 text-center font-bold text-blue-700">{entry.points}</td>
              <td className="px-3 py-2 text-center">{entry.wins}</td>
              <td className="px-3 py-2 text-center">{entry.draws}</td>
              <td className="px-3 py-2 text-center">{entry.losses}</td>
              <td className="px-3 py-2 text-center">{entry.goalsFor}</td>
              <td className="px-3 py-2 text-center">{entry.goalsAgainst}</td>
              <td className="px-3 py-2 text-center">
                {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
