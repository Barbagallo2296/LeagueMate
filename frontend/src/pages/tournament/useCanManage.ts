import { useQuery } from '@tanstack/react-query'
import { getMyTournaments } from '../../api/tournaments'
import { useAuth } from '../../auth/authContext'

export function useCanManage(tournamentId: number): boolean {
  const { user, isAdmin } = useAuth()
  const isOrganizer = user?.role === 'ORGANIZER'
  const { data } = useQuery({
    queryKey: ['tournaments', 'mine'],
    queryFn: getMyTournaments,
    enabled: isOrganizer,
  })

  if (isAdmin) return true
  return isOrganizer && (data?.some((tournament) => tournament.id === tournamentId) ?? false)
}
