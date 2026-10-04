import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getRecap } from '../../api/ai'
import { getRounds } from '../../api/tournaments'
import type { Round } from '../../api/types'
import Card from '../../components/ui/Card'

const EXCERPT_LENGTH = 200

function isCompleted(round: Round): boolean {
  return round.matches.every((match) => match.status === 'COMPLETED')
}

function RecapTeaser({ tournamentId, roundNumber }: { tournamentId: number; roundNumber: number }) {
  const { data } = useQuery({
    queryKey: ['tournament', tournamentId, 'recap', roundNumber],
    queryFn: () => getRecap(tournamentId, roundNumber),
  })

  if (data?.status !== 'READY' || !data.content) return null

  const excerpt =
    data.content.length > EXCERPT_LENGTH ? `${data.content.slice(0, EXCERPT_LENGTH).trimEnd()}…` : data.content

  return (
    <section className="space-y-3 rounded-2xl border border-ai-line bg-ai-soft p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-ai">Cronaca AI · Giornata {roundNumber}</p>
      <p className="text-sm leading-relaxed text-reading">{excerpt}</p>
      <Link to={`/tornei/${tournamentId}/ai`} className="inline-block text-sm font-bold text-ai hover:underline">
        Leggi la cronaca →
      </Link>
    </section>
  )
}

export default function OverviewSidebar({ tournamentId }: { tournamentId: number }) {
  const { data: rounds } = useQuery({
    queryKey: ['tournament', tournamentId, 'rounds'],
    queryFn: () => getRounds(tournamentId),
  })

  if (!rounds || rounds.length === 0) return null

  const lastCompleted = [...rounds].reverse().find(isCompleted)
  const shown = lastCompleted ?? rounds[0]

  return (
    <>
      <Card
        title={lastCompleted ? `Giornata ${shown.roundNumber}` : `Prossima: giornata ${shown.roundNumber}`}
        actions={
          <Link to={`/tornei/${tournamentId}/calendario`} className="text-sm font-semibold text-lime hover:underline">
            Calendario
          </Link>
        }
      >
        <ul className="divide-y divide-line">
          {shown.matches.map((match) => (
            <li key={match.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 text-sm font-semibold">
              <span className="text-right">{match.homeTeamName}</span>
              <span className="min-w-14 rounded-md bg-score text-on-score px-2 py-0.5 text-center font-display text-lg font-bold">
                {match.status === 'COMPLETED' ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
              </span>
              <span>{match.awayTeamName}</span>
            </li>
          ))}
        </ul>
      </Card>
      {lastCompleted && <RecapTeaser tournamentId={tournamentId} roundNumber={lastCompleted.roundNumber} />}
    </>
  )
}
