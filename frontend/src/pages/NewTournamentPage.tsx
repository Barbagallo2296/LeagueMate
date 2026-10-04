import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router'
import { errorMessage } from '../api/client'
import { createTournament, type NewTournamentData } from '../api/tournaments'
import { useAuth } from '../auth/authContext'
import ErrorMessage from '../components/ErrorMessage'
import TextField from '../components/TextField'
import Button from '../components/ui/Button'

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
      navigate(`/tornei/${tournament.id}`)
    },
  })

  if (!canOrganize) {
    return <Navigate to="/" replace />
  }

  return (
    <section className="mx-auto max-w-lg space-y-6">
      <div>
        <Link to="/" className="text-sm text-muted hover:text-ink">
          ← Tornei
        </Link>
        <h1 className="mt-2 font-display text-5xl font-bold uppercase leading-none tracking-wide">Nuovo torneo</h1>
        <p className="mt-2 text-muted">Dopo la creazione potrai iscrivere le squadre e generare il calendario.</p>
      </div>
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="space-y-5 rounded-2xl border border-line bg-panel shadow-card p-6"
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
        <label className="flex items-center gap-3 text-reading">
          <input type="checkbox" className="h-5 w-5 accent-lime" {...register('doubleRoundRobin')} />
          Andata e ritorno
        </label>
        <Button type="submit" size="lg" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Creazione in corso...' : 'Crea torneo'}
        </Button>
      </form>
    </section>
  )
}
