import type { TournamentStatus } from '../api/types'

const LABELS: Record<TournamentStatus, string> = {
  DRAFT: 'In preparazione',
  ACTIVE: 'In corso',
  COMPLETED: 'Concluso',
}

const COLORS: Record<TournamentStatus, string> = {
  DRAFT: 'bg-warn-soft text-warn',
  ACTIVE: 'bg-lime text-on-lime',
  COMPLETED: 'bg-closed-soft text-closed',
}

export default function StatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${COLORS[status]}`}
    >
      {LABELS[status]}
    </span>
  )
}
