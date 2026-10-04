import { NavLink } from 'react-router'

export interface TabItem {
  to: string
  label: string
  end?: boolean
  ai?: boolean
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" strokeLinejoin="round" />
    </svg>
  )
}

export default function Tabs({ items }: { items: TabItem[] }) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-[3px] px-4 py-3 font-semibold transition-colors ${
              isActive
                ? `${item.ai ? 'border-ai' : 'border-lime'} text-ink`
                : `border-transparent ${item.ai ? 'text-ai/80 hover:text-ai' : 'text-muted hover:text-ink'}`
            }`
          }
        >
          {item.ai && <SparkleIcon />}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
