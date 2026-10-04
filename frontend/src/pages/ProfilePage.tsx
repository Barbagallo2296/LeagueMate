import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/authContext'
import UserAvatar from '../components/ui/UserAvatar'
import { ROLE_LABELS } from '../utils/roles'

const SECTIONS = [
  { to: '/profilo', end: true, label: 'Profilo pubblico', description: 'Bio, foto e telefono' },
  { to: '/profilo/account', end: false, label: 'Account', description: 'Nome, cognome ed email' },
  { to: '/profilo/sicurezza', end: false, label: 'Sicurezza', description: 'Password e sessioni' },
]

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center gap-5 rounded-2xl bg-hero p-6 text-on-hero sm:p-8">
        <UserAvatar user={user} size="lg" />
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-hero-muted">
            @{user.username} · <span className="font-semibold text-hero-accent">{ROLE_LABELS[user.role]}</span>
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <nav
          aria-label="Sezioni del profilo"
          className="no-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden md:w-64 md:shrink-0 md:flex-col md:overflow-visible"
        >
          {SECTIONS.map((section) => (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.end}
              className={({ isActive }) =>
                `shrink-0 rounded-xl border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-lime/60 bg-panel shadow-card'
                    : 'border-transparent hover:border-line hover:bg-panel'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`block font-semibold ${isActive ? 'text-ink' : 'text-reading'}`}>
                    {section.label}
                  </span>
                  <span className="hidden text-xs text-muted md:block">{section.description}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
