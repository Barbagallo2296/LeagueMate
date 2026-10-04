import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { errorMessage } from '../../api/client'
import type { User } from '../../api/types'
import { changePassword, updateAccount, type AccountData } from '../../api/users'
import { useAuth } from '../../auth/authContext'
import ErrorMessage from '../../components/ErrorMessage'
import TextField from '../../components/TextField'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

function SuccessMessage({ message }: { message: string }) {
  return (
    <p role="status" className="rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime">
      {message}
    </p>
  )
}

export function AccountForm({ user }: { user: User }) {
  const { updateUser } = useAuth()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountData>({
    defaultValues: { firstName: user.firstName, lastName: user.lastName, email: user.email },
  })

  const mutation = useMutation({
    mutationFn: updateAccount,
    onSuccess: (updated) => {
      updateUser(updated)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      reset({ firstName: updated.firstName, lastName: updated.lastName, email: updated.email })
    },
  })

  return (
    <Card title="Dati dell'account">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
        {mutation.error && <ErrorMessage message={errorMessage(mutation.error)} />}
        {mutation.isSuccess && !isDirty && <SuccessMessage message="Dati aggiornati." />}
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Nome"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'Inserisci il nome',
              maxLength: { value: 50, message: 'Massimo 50 caratteri' },
            })}
          />
          <TextField
            label="Cognome"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Inserisci il cognome',
              maxLength: { value: 50, message: 'Massimo 50 caratteri' },
            })}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: "Inserisci l'email",
            maxLength: { value: 100, message: 'Massimo 100 caratteri' },
          })}
        />
        <div>
          <p className="mb-1.5 text-sm font-semibold text-reading">Username</p>
          <p className="flex h-11 items-center rounded-lg border border-dashed border-line px-3 text-muted">
            {user.username}
          </p>
          <p className="mt-1 text-xs text-muted">Lo username serve per accedere e non si può modificare.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? 'Salvataggio...' : 'Salva dati'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

interface PasswordFormValues {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function PasswordForm() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PasswordFormValues>()

  const mutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onSuccess: async () => {
      await logout()
      navigate('/login', {
        replace: true,
        state: { notice: 'Password cambiata. Per sicurezza abbiamo chiuso tutte le sessioni: accedi con la nuova password.' },
      })
    },
  })

  return (
    <Card title="Cambia password">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
        {mutation.error && <ErrorMessage message={errorMessage(mutation.error)} />}
        <TextField
          label="Password attuale"
          type="password"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: 'Inserisci la password attuale' })}
        />
        <TextField
          label="Nuova password"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'Inserisci la nuova password',
            minLength: { value: 8, message: 'Almeno 8 caratteri' },
            maxLength: { value: 72, message: 'Massimo 72 caratteri' },
          })}
        />
        <TextField
          label="Ripeti la nuova password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Ripeti la nuova password',
            validate: (value) => value === getValues('newPassword') || 'Le due password non coincidono',
          })}
        />
        <p className="text-xs leading-relaxed text-muted">
          Dopo il cambio verrai disconnesso da tutti i dispositivi e dovrai accedere di nuovo.
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvataggio...' : 'Cambia password'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
