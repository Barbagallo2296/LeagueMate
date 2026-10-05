export const DEFAULT_AVATARS = [
  { url: '/avatars/pallone.svg', label: 'Pallone' },
  { url: '/avatars/maglia.svg', label: 'Maglia' },
  { url: '/avatars/fischietto.svg', label: 'Fischietto' },
  { url: '/avatars/coppa.svg', label: 'Coppa' },
  { url: '/avatars/porta.svg', label: 'Porta' },
  { url: '/avatars/campo.svg', label: 'Campo' },
  { url: '/avatars/fascia.svg', label: 'Fascia da capitano' },
  { url: '/avatars/medaglia.svg', label: 'Medaglia' },
]

export function isDefaultAvatar(url: string): boolean {
  return DEFAULT_AVATARS.some((avatar) => avatar.url === url)
}
