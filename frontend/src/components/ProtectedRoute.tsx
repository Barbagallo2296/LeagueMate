import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/authContext'
import Spinner from './Spinner'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spinner />
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
