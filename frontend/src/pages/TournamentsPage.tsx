import { useQueries, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { errorMessage } from '../api/client'
import { getMyTournaments, getStats, getTournaments } from '../api/tournaments'
import type { Tournament, TournamentStatus } from '../api/types'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import { buttonClasses } from '../components/ui/buttonStyles'
import FeaturedTournament from './home/FeaturedTournament'
import { useStartedTournaments } from './home/homeData'
import { LatestRecapsCard, NextMatchesCard, TodoCard } from './home/HomeWidgets'
import TournamentCard from './home/TournamentCard'
import TournamentList from './home/TournamentList'

type StatusTab = TournamentStatus | 'ALL'
type ViewMode = 'list' | 'grid'

const VIEW_KEY = 'leaguemate.homeView'

const TABS: { value: StatusTab; label: string }[] = [
  { value: 'ACTIVE', label: 'In corso' },
  { value: 'DRAFT', label: 'In preparazione' },
  { value: 'COMPLETED', label: 'Conclusi' },
  { value: 'ALL', label: 'Tutti' },
]

const EMPTY_MESSAGES: Record<StatusTab, string> = {
  ACTIVE: 'Nessun torneo in corso.',
  DRAFT: 'Nessun torneo in preparazione.',
  COMPLETED: 'Nessun torneo concluso.',
  ALL: 'Nessun torneo da mostrare.',
}

function savedView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}

interface StatusPillProps {
  value: number
  singular: string
  plural: string
  color: string
}

function StatusPill({ value, singular, plural, color }: StatusPillProps) {
  return (
    <span className="rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-reading shadow-card">
      <span className={`font-bold ${color}`}>{value}</span> {value === 1 ? singular : plural}
    </span>
  )
}

function useFeatured(tournaments: Tournament[]) {
  const active = tournaments.filter((tournament) => tournament.status === 'ACTIVE')
  const stats = useQueries({
    queries: active.map((tournament) => ({
      queryKey: ['tournament', tournament.id, 'stats'],
      queryFn: () => getStats(tournament.id),
    })),
  })

  let best: { index: number; played: number } | undefined
  active.forEach((_, index) => {
    const played = stats[index]?.data?.playedMatches ?? 0
    if (played > 0 && (!best || played > best.played)) best = { index, played }
  })

  if (!best) return undefined
  const featuredStats = stats[best.index].data
  return featuredStats ? { tournament: active[best.index], stats: featuredStats } : undefined
}

export default function TournamentsPage() {
  const { user, isAdmin, canOrganize } = useAuth()
  const [tab, setTab] = useState<StatusTab | null>(null)
  const [onlyMine, setOnlyMine] = useState(false)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>(savedView)

  const all = useQuery({ queryKey: ['tournaments', 'all'], queryFn: () => getTournaments() })
  const mine = useQuery({ queryKey: ['tournaments', 'mine'], queryFn: getMyTournaments, enabled: canOrganize })
  const featured = useFeatured(all.data ?? [])
  const started = useStartedTournaments(all.data ?? [])

  function changeView(next: ViewMode) {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      return
    }
  }

  const source = (onlyMine ? mine.data : all.data) ?? []
  const query = search.trim().toLowerCase()
  const matching = source.filter((tournament) => !query || tournament.name.toLowerCase().includes(query))
  const count = (value: StatusTab) =>
    value === 'ALL' ? matching.length : matching.filter((tournament) => tournament.status === value).length
  const total = (value: TournamentStatus) => all.data?.filter((tournament) => tournament.status === value).length ?? 0

  const currentTab: StatusTab = tab ?? (count('ACTIVE') > 0 ? 'ACTIVE' : 'ALL')
  const visible = currentTab === 'ALL' ? matching : matching.filter((tournament) => tournament.status === currentTab)
  const isPending = all.isPending || (onlyMine && mine.isPending)
  const error = all.error ?? mine.error
  const manageable = canOrganize ? (isAdmin ? all.data : mine.data) : undefined

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-wide">
            Ciao, {user?.firstName}
          </h1>
          <p className="mt-2 text-muted">Ecco come stanno andando i tornei.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {all.data && (
            <>
              <StatusPill value={total('ACTIVE')} singular="in corso" plural="in corso" color="text-lime" />
              <StatusPill value={total('DRAFT')} singular="in preparazione" plural="in preparazione" color="text-warn" />
              <StatusPill value={total('COMPLETED')} singular="concluso" plural="conclusi" color="text-closed" />
            </>
          )}
          {canOrganize && (
            <Link to="/tornei/nuovo" className={buttonClasses('primary', 'lg', 'ml-2')}>
              <PlusIcon />
              Nuovo torneo
            </Link>
          )}
        </div>
      </div>

      {error && <ErrorMessage message={errorMessage(error)} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          {featured && <FeaturedTournament tournament={featured.tournament} stats={featured.stats} />}

          <section className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex flex-wrap gap-1" role="group" aria-label="Filtra per stato">
                {TABS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTab(item.value)}
                    aria-pressed={currentTab === item.value}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                      currentTab === item.value ? 'bg-lime text-on-lime' : 'text-muted hover:bg-raised hover:text-ink'
                    }`}
                  >
                    {item.label} <span className="opacity-70">{count(item.value)}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {canOrganize && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={onlyMine}
                    onClick={() => setOnlyMine((value) => !value)}
                    className="flex items-center gap-2 text-sm font-semibold text-reading"
                  >
                    <span
                      className={`relative h-5 w-9 rounded-full transition-colors ${onlyMine ? 'bg-lime' : 'bg-track'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                          onlyMine ? 'left-[18px] bg-on-lime' : 'left-0.5 bg-panel shadow'
                        }`}
                      />
                    </span>
                    Solo i miei
                  </button>
                )}
                <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="Vista">
                  {(['list', 'grid'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => changeView(mode)}
                      aria-pressed={view === mode}
                      aria-label={mode === 'list' ? 'Vista a elenco' : 'Vista a griglia'}
                      className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
                        view === mode ? 'bg-raised text-ink' : 'text-muted hover:text-ink'
                      }`}
                    >
                      {mode === 'list' ? <ListIcon /> : <GridIcon />}
                    </button>
                  ))}
                </div>
                <label className="relative w-48">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cerca un torneo"
                    aria-label="Cerca un torneo per nome"
                    className="h-9 w-full rounded-lg border border-line bg-field pl-8 pr-2 text-sm text-ink placeholder:text-muted focus:border-lime focus:outline-none"
                  />
                </label>
              </div>
            </div>

            {isPending && <Spinner />}

            {!isPending && visible.length === 0 && (
              <p className="px-5 py-6 text-reading">
                {query
                  ? `Nessun torneo trovato per "${search.trim()}".`
                  : onlyMine && source.length === 0
                    ? 'Non organizzi ancora nessun torneo: creane uno con "Nuovo torneo".'
                    : EMPTY_MESSAGES[currentTab]}
              </p>
            )}

            {visible.length > 0 &&
              (view === 'list' ? (
                <TournamentList tournaments={visible} />
              ) : (
                <div className="grid gap-4 p-4 sm:grid-cols-2">
                  {visible.map((tournament) => (
                    <TournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
              ))}
          </section>
        </div>

        <aside className="min-w-0 space-y-6">
          {manageable && <TodoCard tournaments={manageable} />}
          <NextMatchesCard items={started} />
          <LatestRecapsCard items={started} />
        </aside>
      </div>
    </section>
  )
}
