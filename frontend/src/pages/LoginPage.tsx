import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'

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

  const from = (location.state as { from?: string } | null)?.from ?? '/'

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow"
      >
        <h1 className="text-center text-3xl font-bold text-blue-700">LeagueMate</h1>
        <p className="text-center text-slate-600">Accedi per vedere i tornei</p>
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Non hai un account?{' '}
          <Link to="/register" className="font-medium text-blue-700 hover:underline">
            Registrati
          </Link>
        </p>
      </form>
    </main>
  )
}
