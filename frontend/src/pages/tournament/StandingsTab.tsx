import { useQuery } from '@tanstack/react-query'
import { errorMessage } from '../../api/client'
import { getRounds, getStandings } from '../../api/tournaments'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Card from '../../components/ui/Card'
import { recentForm, type Outcome } from '../../utils/form'
import { teamInitials } from '../../utils/teams'

const HEAD = 'px-2 py-2.5 text-center font-semibold'
const CELL = 'px-2 py-3 text-center text-muted'
const WIDE_ONLY = 'hidden sm:table-cell'

const OUTCOME_STYLES: Record<Outcome, string> = {
  V: 'bg-lime text-on-lime',
  N: 'bg-track text-ink',
  P: 'bg-closed text-night',
}

const OUTCOME_LABELS: Record<Outcome, string> = { V: 'vittoria', N: 'pareggio', P: 'sconfitta' }

function FormDots({ outcomes }: { outcomes: Outcome[] }) {
  if (outcomes.length === 0) return <span className="text-muted">–</span>
  return (
    <span
      className="flex justify-center gap-1"
      aria-label={`Ultimi risultati: ${outcomes.map((o) => OUTCOME_LABELS[o]).join(', ')}`}
    >
      {outcomes.map((outcome, index) => (
        <span
          key={index}
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${OUTCOME_STYLES[outcome]}`}
        >
          {outcome}
        </span>
      ))}
    </span>
  )
}

export default function StandingsTab({ tournamentId }: { tournamentId: number }) {
  const { data, isPending, error } = useQuery({
    queryKey: ['tournament', tournamentId, 'standings'],
    queryFn: () => getStandings(tournamentId),
  })
  const { data: rounds } = useQuery({
    queryKey: ['tournament', tournamentId, 'rounds'],
    queryFn: () => getRounds(tournamentId),
  })

  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  const started = data.some((entry) => entry.wins + entry.draws + entry.losses > 0)
  const form = recentForm(rounds ?? [])

  return (
    <Card title="Classifica" padded={false}>
      {data.length === 0 ? (
        <p className="px-5 pb-5 text-muted">Nessuna squadra iscritta.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-raised/60 text-xs uppercase tracking-wide text-muted">
                  <th className="py-2.5 pl-5 pr-2 text-left font-semibold">#</th>
                  <th className="px-2 py-2.5 text-left font-semibold">Squadra</th>
                  <th className={HEAD}>G</th>
                  <th className={`${HEAD} ${WIDE_ONLY}`}>V</th>
                  <th className={`${HEAD} ${WIDE_ONLY}`}>N</th>
                  <th className={`${HEAD} ${WIDE_ONLY}`}>P</th>
                  <th className={`${HEAD} ${WIDE_ONLY}`}>GF</th>
                  <th className={`${HEAD} ${WIDE_ONLY}`}>GS</th>
                  <th className={HEAD}>DR</th>
                  <th className="px-2 py-2.5 text-center font-semibold">Pt</th>
                  <th className="hidden py-2.5 pl-2 pr-5 text-center font-semibold lg:table-cell">Forma</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <tr key={entry.teamName} className="border-t border-line">
                    <td className="py-3 pl-5 pr-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
                          started && index < 2 ? 'bg-lime text-on-lime' : 'bg-raised text-muted'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-3">
                        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-[11px] font-bold text-lime sm:flex">
                          {teamInitials(entry.teamName)}
                        </span>
                        <span className="font-semibold text-ink">{entry.teamName}</span>
                      </span>
                    </td>
                    <td className={CELL}>{entry.wins + entry.draws + entry.losses}</td>
                    <td className={`${CELL} ${WIDE_ONLY}`}>{entry.wins}</td>
                    <td className={`${CELL} ${WIDE_ONLY}`}>{entry.draws}</td>
                    <td className={`${CELL} ${WIDE_ONLY}`}>{entry.losses}</td>
                    <td className={`${CELL} ${WIDE_ONLY}`}>{entry.goalsFor}</td>
                    <td className={`${CELL} ${WIDE_ONLY}`}>{entry.goalsAgainst}</td>
                    <td className={CELL}>
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                    </td>
                    <td className="px-2 py-3 text-center font-display text-xl font-bold text-ink">{entry.points}</td>
                    <td className="hidden py-3 pl-2 pr-5 lg:table-cell">
                      <FormDots outcomes={form.get(entry.teamName) ?? []} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-xs text-muted">
            G giocate · V vinte · N pareggiate · P perse · GF gol fatti · GS gol subiti · DR differenza reti · Forma:
            ultime 5 partite, dalla più vecchia alla più recente
          </p>
        </>
      )}
    </Card>
  )
}
