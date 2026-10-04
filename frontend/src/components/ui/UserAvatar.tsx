import { useQuery } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import type { User } from '../../api/types'
import { getProfile } from '../../api/users'

const SIZES = {
  sm: 'h-9 w-9 text-xs',
  lg: 'h-20 w-20 border-2 border-hero-accent text-3xl',
}

const FALLBACK_COLORS = {
  sm: 'bg-raised text-lime',
  lg: 'bg-hero-track text-hero-accent',
}

interface AvatarImageProps {
  url: string
  user: User
  className: string
  fallback: ReactNode
}

function AvatarImage({ url, user, className, fallback }: AvatarImageProps) {
  const [failed, setFailed] = useState(false)
  if (failed) return fallback
  return (
    <img
      src={url}
      alt={`Avatar di ${user.username}`}
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-full object-cover`}
    />
  )
}

export default function UserAvatar({ user, size = 'sm' }: { user: User; size?: 'sm' | 'lg' }) {
  const { data: profile } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: () => getProfile(user.id),
  })

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  const fallback = (
    <span
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full font-display font-bold ${FALLBACK_COLORS[size]}`}
    >
      {initials}
    </span>
  )

  if (!profile?.avatarUrl) return fallback

  return <AvatarImage key={profile.avatarUrl} url={profile.avatarUrl} user={user} className={SIZES[size]} fallback={fallback} />
}
