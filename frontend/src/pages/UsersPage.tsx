import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Navigate } from 'react-router'
import { errorMessage } from '../api/client'
import type { Role, User } from '../api/types'
import { getUsers, updateRole } from '../api/users'
import { useAuth } from '../auth/authContext'
import ConfirmDialog from '../components/ConfirmDialog'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'
import { ROLE_LABELS } from '../utils/roles'

const ROLES: Role[] = ['USER', 'ORGANIZER', 'ADMIN']

const ROLE_COLORS: Record<Role, string> = {
  USER: 'bg-raised text-muted',
  ORGANIZER: 'bg-lime/15 text-lime',
  ADMIN: 'bg-ai-soft text-ai',
}

function UserRow({ user, isMe }: { user: User; isMe: boolean }) {
  const queryClient = useQueryClient()
  const [pendingRole, setPendingRole] = useState<Role | null>(null)

  const mutation = useMutation({
    mutationFn: (role: Role) => updateRole(user.id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onSettled: () => setPendingRole(null),
  })

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  return (
    <li className="space-y-2 px-5 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised font-display font-bold text-lime">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">
            {user.firstName} {user.lastName}
            {isMe && <span className="ml-2 text-xs font-bold uppercase text-muted">(tu)</span>}
          </p>
          <p className="truncate text-sm text-muted">
            @{user.username} · {user.email}
          </p>
        </div>
        {isMe ? (
          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${ROLE_COLORS[user.role]}`}>
            {ROLE_LABELS[user.role]}
          </span>
        ) : (
          <select
            value={user.role}
            onChange={(event) => setPendingRole(event.target.value as Role)}
            disabled={mutation.isPending}
            aria-label={`Ruolo di ${user.username}`}
            className="h-10 rounded-lg border border-line bg-field px-3 text-sm font-semibold text-ink focus:border-lime focus:outline-none"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        )}
      </div>
      {mutation.error && <ErrorMessage message={errorMessage(mutation.error)} />}
      <ConfirmDialog
        open={pendingRole !== null}
        title="Cambiare il ruolo?"
        message={
          pendingRole
            ? `${user.firstName} ${user.lastName} passerà da ${ROLE_LABELS[user.role]} a ${ROLE_LABELS[pendingRole]}.`
            : ''
        }
        confirmLabel="Cambia ruolo"
        pending={mutation.isPending}
        onConfirm={() => pendingRole && mutation.mutate(pendingRole)}
        onCancel={() => setPendingRole(null)}
      />
    </li>
  )
}

export default function UsersPage() {
  const { user: me, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const { data, isPending, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin,
  })

  if (!isAdmin) return <Navigate to="/" replace />

  const query = search.trim().toLowerCase()
  const visible =
    data?.filter((user) =>
      [user.username, user.firstName, user.lastName, user.email].some((field) => field.toLowerCase().includes(query)),
    ) ?? []

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-wide">Utenti</h1>
        <p className="mt-2 text-muted">
          Chi si registra parte come Utente. Da qui puoi promuoverlo a Organizzatore o Amministratore.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Cerca per nome, username o email"
        aria-label="Cerca un utente"
        className="h-11 w-full max-w-md rounded-lg border border-line bg-panel px-3 text-ink placeholder:text-muted focus:border-lime focus:outline-none"
      />

      {isPending && <Spinner />}
      {error && <ErrorMessage message={errorMessage(error)} />}

      {data && (
        <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
          <div className="flex items-baseline justify-between border-b border-line px-5 py-3 text-sm text-muted">
            <span>{visible.length} utenti</span>
            <span>Ruolo</span>
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-6 text-reading">Nessun utente trovato.</p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((user) => (
                <UserRow key={user.id} user={user} isMe={user.id === me?.id} />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
