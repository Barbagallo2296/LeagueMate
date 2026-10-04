import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { register as registerUser, type RegisterData } from '../api/auth'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/authContext'
import AuthShell from '../components/AuthShell'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'
import Button from '../components/ui/Button'

export default function RegisterPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>()

  if (user) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(values: RegisterData) {
    setError(null)
    try {
      await registerUser(values)
      await login(values.username, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide">Crea un account</h2>
          <p className="mt-1 text-muted">Bastano pochi dati per seguire i tornei.</p>
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
          <TextField
            label="Nome"
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'Inserisci il nome',
              maxLength: { value: 50, message: 'Massimo 50 caratteri' },
            })}
          />
          <TextField
            label="Cognome"
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
        <TextField
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username', {
            required: 'Inserisci lo username',
            minLength: { value: 3, message: 'Almeno 3 caratteri' },
            maxLength: { value: 20, message: 'Massimo 20 caratteri' },
          })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Inserisci la password',
            minLength: { value: 8, message: 'Almeno 8 caratteri' },
            maxLength: { value: 72, message: 'Massimo 72 caratteri' },
          })}
        />
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
        </Button>
        <p className="text-center text-sm text-muted">
          Hai già un account?{' '}
          <Link to="/login" className="font-bold text-lime hover:underline">
            Accedi
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
