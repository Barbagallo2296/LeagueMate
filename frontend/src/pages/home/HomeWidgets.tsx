import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router'
import { getRecap } from '../../api/ai'
import { getStats } from '../../api/tournaments'
import type { Match, Round, Tournament } from '../../api/types'
import Card from '../../components/ui/Card'
import { isCompleted, type TournamentRounds } from './homeData'

const MAX_BLOCKS = 3
const MAX_MATCHES = 4
const EXCERPT_LENGTH = 120

function MatchLine({ match }: { match: Match }) {
  const played = match.status === 'COMPLETED'
  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1 text-sm">
      <span className="truncate text-right text-reading">{match.homeTeamName}</span>
      <span
        className={`min-w-11 rounded px-1.5 text-center font-display font-bold ${
          played ? 'bg-score text-on-score' : 'border border-line text-xs text-muted'
        }`}
      >
        {played ? `${match.homeScore}-${match.awayScore}` : 'VS'}
      </span>
      <span className="truncate text-reading">{match.awayTeamName}</span>
    </li>
  )
}

interface TodoItem {
  tournament: Tournament
  text: string
  dot: string
}

export function TodoCard({ tournaments }: { tournaments: Tournament[] }) {
  const relevant = tournaments.filter((tournament) => tournament.status !== 'COMPLETED')
  const stats = useQueries({
    queries: relevant.map((tournament) => ({
      queryKey: ['tournament', tournament.id, 'stats'],
      queryFn: () => getStats(tournament.id),
    })),
  })

  const items: TodoItem[] = []
  relevant.forEach((tournament, index) => {
    const data = stats[index]?.data
    if (!data) return
    if (tournament.status === 'DRAFT') {
      items.push({
        tournament,
        dot: 'bg-warn',
        text:
          data.registeredTeams >= 2
            ? 'genera il calendario'
            : `iscrivi almeno 2 squadre (ora ${data.registeredTeams})`,
      })
    } else if (data.remainingMatches > 0) {
      items.push({
        tournament,
        dot: 'bg-lime',
        text: `${data.remainingMatches} ${data.remainingMatches === 1 ? 'risultato' : 'risultati'} da inserire`,
      })
    } else {
      items.push({ tournament, dot: 'bg-closed', text: 'puoi chiudere il torneo' })
    }
  })

  if (items.length === 0) return null

  return (
    <Card title="Da fare">
      <ul className="-my-1 divide-y divide-line">
        {items.map((item) => (
          <li key={item.tournament.id}>
            <Link
              to={`/tornei/${item.tournament.id}/gestione`}
              className="group flex items-center gap-3 py-3 text-sm"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink group-hover:text-lime">
                  {item.tournament.name}
                </span>
                <span className="text-muted">{item.text}</span>
              </span>
              <span className="shrink-0 font-bold text-lime">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export function NextMatchesCard({ items }: { items: TournamentRounds[] }) {
  const blocks = items
    .filter((item) => item.tournament.status === 'ACTIVE')
    .map((item) => ({ tournament: item.tournament, round: item.rounds?.find((round) => !isCompleted(round)) }))
    .filter((block): block is { tournament: Tournament; round: Round } => block.round !== undefined)
    .slice(0, MAX_BLOCKS)

  if (blocks.length === 0) return null

  return (
    <Card title="Prossime partite">
      <div className="space-y-4">
        {blocks.map(({ tournament, round }) => (
          <div key={tournament.id}>
            <Link
              to={`/tornei/${tournament.id}/calendario`}
              className="mb-1 flex justify-between gap-2 text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
            >
              <span className="truncate">{tournament.name}</span>
              <span className="shrink-0">G{round.roundNumber}</span>
            </Link>
            <ul>
              {round.matches
                .filter((match) => match.status !== 'COMPLETED')
                .slice(0, MAX_MATCHES)
                .map((match) => (
                  <MatchLine key={match.id} match={match} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function LatestRecapsCard({ items }: { items: TournamentRounds[] }) {
  const targets = items
    .map((item) => ({ tournament: item.tournament, round: item.rounds?.slice().reverse().find(isCompleted) }))
    .filter((target): target is { tournament: Tournament; round: Round } => target.round !== undefined)

  const recaps = useQueries({
    queries: targets.map(({ tournament, round }) => ({
      queryKey: ['tournament', tournament.id, 'recap', round.roundNumber],
      queryFn: () => getRecap(tournament.id, round.roundNumber),
    })),
  })

  const ready = targets
    .map((target, index) => ({ ...target, content: recaps[index]?.data?.content ?? null }))
    .filter((item, index) => recaps[index]?.data?.status === 'READY' && item.content)
    .slice(0, MAX_BLOCKS)

  if (ready.length === 0) return null

  return (
    <section className="space-y-4 rounded-2xl border border-ai-line bg-ai-soft p-5">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold uppercase tracking-wide text-ai">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" strokeLinejoin="round" />
        </svg>
        Ultime cronache AI
      </h2>
      {ready.map(({ tournament, round, content }) => {
        const text = content ?? ''
        const excerpt = text.length > EXCERPT_LENGTH ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…` : text
        return (
          <Link key={tournament.id} to={`/tornei/${tournament.id}/ai`} className="group block space-y-1">
            <p className="text-sm font-bold text-ink group-hover:text-ai">
              Giornata {round.roundNumber} · {tournament.name}
            </p>
            <p className="text-sm leading-relaxed text-reading">{excerpt}</p>
          </Link>
        )
      })}
    </section>
  )
}
