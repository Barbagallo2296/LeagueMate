import AssistantTab from './AssistantTab'
import { Navigate } from 'react-router'
import CalendarTab from './CalendarTab'
import ManageTab from './ManageTab'
import OverviewSidebar from './OverviewSidebar'
import RecapsTab from './RecapsTab'
import StandingsTab from './StandingsTab'
import StatsTab from './StatsTab'
import TeamsTab from './TeamsTab'
import { useTournament } from './tournamentContext'

export function OverviewTab() {
  const { tournament } = useTournament()
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_560px]">
        <StandingsTab tournamentId={tournament.id} />
      </div>
      <aside className="min-w-0 flex-[1_1_320px] space-y-6">
        <StatsTab tournamentId={tournament.id} />
        <OverviewSidebar tournamentId={tournament.id} />
      </aside>
    </div>
  )
}

export function CalendarRoute() {
  const { tournament } = useTournament()
  return <CalendarTab tournamentId={tournament.id} />
}

export function TeamsRoute() {
  const { tournament } = useTournament()
  return <TeamsTab tournamentId={tournament.id} />
}

export function ManageRoute() {
  const { tournament, canManage } = useTournament()
  if (!canManage) return <Navigate to={`/tornei/${tournament.id}`} replace />
  return <ManageTab tournament={tournament} />
}

export function AiRoute() {
  const { tournament, canManage } = useTournament()

  if (tournament.status === 'DRAFT') {
    return (
      <p className="rounded-2xl border border-line bg-panel shadow-card p-6 text-reading">
        Cronache e assistente saranno disponibili quando il torneo inizierà e ci saranno partite da raccontare.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="min-w-0 flex-[999_1_520px]">
        <RecapsTab tournamentId={tournament.id} tournamentName={tournament.name} canManage={canManage} />
      </div>
      <div className="min-w-0 flex-[1_1_340px]">
        <AssistantTab tournamentId={tournament.id} />
      </div>
    </div>
  )
}
