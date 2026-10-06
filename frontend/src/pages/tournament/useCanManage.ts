import { useQuery } from '@tanstack/react-query'
import { getMyTournaments } from '../../api/tournaments'
import { useAuth } from '../../auth/authContext'

interface ManagePermission {
  canManage: boolean
  checking: boolean
}

export function useCanManage(tournamentId: number): ManagePermission {
  const { user, isAdmin } = useAuth()
  const isOrganizer = user?.role === 'ORGANIZER'
  const { data, isPending, isFetching } = useQuery({
    queryKey: ['tournaments', 'mine'],
    queryFn: getMyTournaments,
    enabled: isOrganizer,
  })

  if (isAdmin) return { canManage: true, checking: false }
  if (!isOrganizer) return { canManage: false, checking: false }

  const organizes = data?.some((tournament) => tournament.id === tournamentId) ?? false
  return { canManage: organizes, checking: isPending || (isFetching && !organizes) }
}
