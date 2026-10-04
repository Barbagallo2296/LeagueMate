import { Link, Outlet } from 'react-router'
import { useAuth } from '../auth/authContext'

export default function Layout() {
  const { user, canOrganize, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-700 text-white shadow">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          <Link to="/" className="text-xl font-bold">
            LeagueMate
          </Link>
          <Link to="/" className="hover:underline">
            Tornei
          </Link>
          {canOrganize && (
            <Link to="/tournaments/new" className="hover:underline">
              Nuovo torneo
            </Link>
          )}
          <span className="ml-auto text-sm">
            {user?.username} · {user?.role}
          </span>
          <button
            onClick={logout}
            className="rounded-lg bg-white/15 px-3 py-1 text-sm hover:bg-white/25"
          >
            Esci
          </button>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
