import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { createTournament, type NewTournamentData } from '../api/tournaments'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'

export default function NewTournamentPage() {
  const { canOrganize } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewTournamentData>({ defaultValues: { doubleRoundRobin: false } })

  const mutation = useMutation({
    mutationFn: createTournament,
    onSuccess: (tournament) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
      navigate(`/tournaments/${tournament.id}`)
    },
  })

  if (!canOrganize) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Nuovo torneo</h1>
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4 rounded-xl bg-white p-6 shadow"
      >
        {mutation.error && <ErrorMessage message={errorMessage(mutation.error)} />}
        <TextField
          label="Nome"
          placeholder="Es. Coppa d'Autunno"
          error={errors.name?.message}
          {...register('name', {
            required: 'Inserisci il nome',
            maxLength: { value: 100, message: 'Massimo 100 caratteri' },
          })}
        />
        <TextField
          label="Stagione"
          placeholder="Es. 2026/27"
          error={errors.season?.message}
          {...register('season', {
            required: 'Inserisci la stagione',
            maxLength: { value: 20, message: 'Massimo 20 caratteri' },
          })}
        />
        <label className="flex items-center gap-2 text-slate-700">
          <input type="checkbox" className="h-4 w-4" {...register('doubleRoundRobin')} />
          Andata e ritorno
        </label>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creazione in corso...' : 'Crea torneo'}
        </button>
      </form>
    </section>
  )
}
