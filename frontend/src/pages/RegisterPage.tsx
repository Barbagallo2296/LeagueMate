import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { register as registerUser, type RegisterData } from '../api/auth'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-center text-3xl font-bold text-blue-700">Crea un account</h1>
        {error && <ErrorMessage message={error} />}
        <div className="grid grid-cols-2 gap-4">
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Registrazione in corso...' : 'Registrati'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Hai già un account?{' '}
          <Link to="/login" className="font-medium text-blue-700 hover:underline">
            Accedi
          </Link>
        </p>
      </form>
    </main>
  )
}
