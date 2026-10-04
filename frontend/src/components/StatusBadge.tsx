import type { TournamentStatus } from '../api/types'

const LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'Bozza',
  ACTIVE: 'In corso',
  COMPLETED: 'Concluso',
}

const COLORS: Record<TournamentStatus, string> = {
  DRAFT: 'bg-amber-100 text-amber-800',
  ACTIVE: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-slate-200 text-slate-700',
}

export default function StatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>
      {LABELS[status]}
    </span>
  )
}
