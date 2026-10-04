import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/authContext'
import AuthShell from '../components/AuthShell'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'
import Button from '../components/ui/Button'

interface LoginForm {
  username: string
  password: string
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>()

  const state = location.state as { from?: string; notice?: string } | null
  const from = state?.from ?? '/'

  if (user) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(values: LoginForm) {
    setError(null)
    try {
      await login(values.username, values.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <AuthShell>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide">Accedi</h2>
          <p className="mt-1 text-muted">Bentornato! Inserisci le tue credenziali.</p>
        </div>
        {state?.notice && !error && (
          <p role="status" className="rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime">
            {state.notice}
          </p>
        )}
        {error && <ErrorMessage message={error} />}
        <TextField
          label="Username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username', { required: 'Inserisci lo username' })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Inserisci la password' })}
        />
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
        </Button>
        <p className="text-center text-sm text-muted">
          Non hai un account?{' '}
          <Link to="/register" className="font-bold text-lime hover:underline">
            Registrati
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
