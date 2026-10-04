import type { Round } from '../api/types'

export type Outcome = 'V' | 'N' | 'P'

export function recentForm(rounds: Round[], limit = 5): Map<string, Outcome[]> {
  const form = new Map<string, Outcome[]>()

  function add(team: string, outcome: Outcome) {
    form.set(team, [...(form.get(team) ?? []), outcome])
  }

  ;[...rounds]
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .forEach((round) =>
      round.matches.forEach((match) => {
        if (match.status !== 'COMPLETED' || match.homeScore === null || match.awayScore === null) return
        const home: Outcome = match.homeScore > match.awayScore ? 'V' : match.homeScore < match.awayScore ? 'P' : 'N'
        const away: Outcome = home === 'V' ? 'P' : home === 'P' ? 'V' : 'N'
        add(match.homeTeamName, home)
        add(match.awayTeamName, away)
      }),
    )

  form.forEach((outcomes, team) => form.set(team, outcomes.slice(-limit)))
  return form
}
