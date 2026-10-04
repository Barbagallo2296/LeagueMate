import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import NewTournamentPage from './pages/NewTournamentPage'
import ProfilePage from './pages/ProfilePage'
import { AccountSection, PublicProfileSection, SecuritySection } from './pages/profile/ProfileSections'
import RegisterPage from './pages/RegisterPage'
import TournamentPage from './pages/TournamentPage'
import TournamentsPage from './pages/TournamentsPage'
import UsersPage from './pages/UsersPage'
import { AiRoute, CalendarRoute, ManageRoute, OverviewTab, TeamsRoute } from './pages/tournament/TournamentTabs'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<TournamentsPage />} />
          <Route path="/tornei/nuovo" element={<NewTournamentPage />} />
          <Route path="/profilo" element={<ProfilePage />}>
            <Route index element={<PublicProfileSection />} />
            <Route path="account" element={<AccountSection />} />
            <Route path="sicurezza" element={<SecuritySection />} />
          </Route>
          <Route path="/utenti" element={<UsersPage />} />
          <Route path="/tornei/:id" element={<TournamentPage />}>
            <Route index element={<OverviewTab />} />
            <Route path="calendario" element={<CalendarRoute />} />
            <Route path="squadre" element={<TeamsRoute />} />
            <Route path="ai" element={<AiRoute />} />
            <Route path="gestione" element={<ManageRoute />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
