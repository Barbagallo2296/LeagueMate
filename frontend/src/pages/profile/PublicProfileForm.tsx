import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { errorMessage } from '../../api/client'
import type { User, UserProfile } from '../../api/types'
import { updateProfile, type ProfileData } from '../../api/users'
import ErrorMessage from '../../components/ErrorMessage'
import TextField from '../../components/TextField'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const BIO_MAX = 500

function AvatarPreview({ url }: { url: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  return (
    <div className="-mt-2 flex items-center gap-3 rounded-lg border border-line bg-field px-3 py-2">
      {state === 'error' ? (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-danger-soft text-lg font-bold text-danger">
          !
        </span>
      ) : (
        <img
          src={url}
          alt="Anteprima dell'immagine del profilo"
          onLoad={() => setState('ok')}
          onError={() => setState('error')}
          className="h-12 w-12 shrink-0 rounded-full border-2 border-lime object-cover"
        />
      )}
      <span className={`text-sm ${state === 'error' ? 'text-danger' : 'text-muted'}`}>
        {state === 'loading' && 'Caricamento anteprima...'}
        {state === 'ok' && 'Anteprima: ecco come apparirà la tua foto.'}
        {state === 'error' &&
          "Impossibile caricare l'immagine: controlla che l'indirizzo punti direttamente a un file .jpg, .png o .webp."}
      </span>
    </div>
  )
}

export default function PublicProfileForm({ user, profile }: { user: User; profile: UserProfile }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileData>({
    defaultValues: {
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      phoneNumber: profile.phoneNumber ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (values: ProfileData) => updateProfile(user.id, values),
    onSuccess: (updated, values) => {
      queryClient.setQueryData(['profile', user.id], updated)
      reset(values)
    },
  })

  const bioLength = useWatch({ control, name: 'bio' })?.length ?? 0
  const avatarUrl = useWatch({ control, name: 'avatarUrl' })?.trim() ?? ''

  return (
    <Card title="Profilo pubblico">
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5">
        {mutation.error && <ErrorMessage message={errorMessage(mutation.error)} />}
        {mutation.isSuccess && !isDirty && (
          <p role="status" className="rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime">
            Profilo aggiornato.
          </p>
        )}
        <label className="block">
          <span className="mb-1.5 flex justify-between text-sm font-semibold text-reading">
            Bio
            <span className="font-normal text-muted">
              {bioLength}/{BIO_MAX}
            </span>
          </span>
          <textarea
            rows={4}
            maxLength={BIO_MAX}
            placeholder="Racconta qualcosa di te: squadra del cuore, ruolo in campo..."
            className="w-full resize-y rounded-lg border border-line bg-field px-3 py-2 text-ink placeholder:text-muted focus:border-lime focus:outline-none"
            {...register('bio', { maxLength: { value: BIO_MAX, message: `Massimo ${BIO_MAX} caratteri` } })}
          />
          {errors.bio && <span className="mt-1 block text-sm text-danger">{errors.bio.message}</span>}
        </label>
        <TextField
          label="Indirizzo dell'immagine del profilo"
          type="url"
          placeholder="https://..."
          error={errors.avatarUrl?.message}
          {...register('avatarUrl', { maxLength: { value: 255, message: 'Massimo 255 caratteri' } })}
        />
        {avatarUrl && <AvatarPreview key={avatarUrl} url={avatarUrl} />}
        <TextField
          label="Telefono"
          type="tel"
          placeholder="+39 333 1234567"
          error={errors.phoneNumber?.message}
          {...register('phoneNumber', {
            pattern: {
              value: /^$|^\+?[0-9\s]{6,20}$/,
              message: 'Solo numeri e spazi, con un + iniziale facoltativo (da 6 a 20 caratteri)',
            },
          })}
        />
        <p className="text-xs text-muted">Il telefono è visibile solo a te e agli amministratori.</p>
        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending ? 'Salvataggio...' : 'Salva modifiche'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
