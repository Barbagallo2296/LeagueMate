import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/authContext'
import Button from './ui/Button'
import Logo from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'
import UserAvatar from './ui/UserAvatar'
import { ROLE_LABELS } from '../utils/roles'

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `flex items-center border-b-[3px] px-3 py-2 font-semibold transition-colors md:h-16 md:py-0 ${
    isActive ? 'border-lime text-ink' : 'border-transparent text-muted hover:text-ink'
  }`
}

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const links = (
    <>
      <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
        Tornei
      </NavLink>
      {isAdmin && (
        <NavLink to="/utenti" className={navLinkClass} onClick={() => setMenuOpen(false)}>
          Utenti
        </NavLink>
      )}
      <NavLink to="/profilo" className={navLinkClass} onClick={() => setMenuOpen(false)}>
        Profilo
      </NavLink>
    </>
  )

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 sm:px-6">
          <Link to="/" className="flex h-16 items-center" aria-label="LeagueMate, vai ai tornei">
            <Logo size={30} />
          </Link>
          <nav className="hidden items-stretch gap-1 md:flex">{links}</nav>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <Link to="/profilo" className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-raised">
              {user && <UserAvatar user={user} />}
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-ink">{user?.username}</span>
                <span className="text-xs text-muted">{user && ROLE_LABELS[user.role]}</span>
              </span>
            </Link>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={logout}>
              Esci
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? 'Chiudi il menu' : 'Apri il menu'}
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-raised"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-line px-4 py-3 md:hidden">
            <nav className="flex flex-col">{links}</nav>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm text-muted">
                <span className="font-bold text-ink">{user?.username}</span> · {user && ROLE_LABELS[user.role]}
              </span>
              <Button variant="secondary" size="sm" onClick={logout}>
                Esci
              </Button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
