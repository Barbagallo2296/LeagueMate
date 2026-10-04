import { useMutation, useQuery } from '@tanstack/react-query'
import { logoutAll } from '../../api/auth'
import { errorMessage } from '../../api/client'
import { getProfile } from '../../api/users'
import { useAuth } from '../../auth/authContext'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { AccountForm, PasswordForm } from './AccountForms'
import PublicProfileForm from './PublicProfileForm'

export function PublicProfileSection() {
  const { user } = useAuth()
  const { data: profile, isPending, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: user !== null,
  })

  if (!user) return null
  if (isPending) return <Spinner />
  if (error) return <ErrorMessage message={errorMessage(error)} />

  return <PublicProfileForm user={user} profile={profile} />
}

export function AccountSection() {
  const { user } = useAuth()
  if (!user) return null
  return <AccountForm user={user} />
}

export function SecuritySection() {
  const { logout } = useAuth()
  const logoutEverywhere = useMutation({
    mutationFn: logoutAll,
    onSuccess: logout,
  })

  return (
    <div className="space-y-6">
      <PasswordForm />
      <Card title="Sessioni attive">
        <div className="space-y-4">
          <p className="leading-relaxed text-reading">
            Hai effettuato l'accesso anche su un altro computer o telefono? Puoi chiudere la sessione ovunque: dovrai
            accedere di nuovo su ogni dispositivo.
          </p>
          {logoutEverywhere.error && <ErrorMessage message={errorMessage(logoutEverywhere.error)} />}
          <Button variant="secondary" onClick={() => logoutEverywhere.mutate()} disabled={logoutEverywhere.isPending}>
            Esci da tutti i dispositivi
          </Button>
        </div>
      </Card>
    </div>
  )
}
