import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  actions?: ReactNode
  padded?: boolean
  className?: string
  children: ReactNode
}

export default function Card({ title, actions, padded = true, className = '', children }: CardProps) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-line bg-panel shadow-card ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-ink">{title}</h2>
          {actions}
        </header>
      )}
      <div className={padded ? 'p-5' : 'pt-4'}>{children}</div>
    </section>
  )
}
