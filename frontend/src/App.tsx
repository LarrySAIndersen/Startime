import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AppShell } from './layout/AppShell'
import {
  AdminHolidaysPage,
  AdminLogPage,
  AdminUsersPage,
  DeputyPage,
  MigLogPage,
} from './pages/AdminPages'
import { GodkendelserPage } from './pages/GodkendelserPage'
import { KalenderPage } from './pages/KalenderPage'
import { LoginPage } from './pages/LoginPage'
import { OverblikPage } from './pages/OverblikPage'
import './App.css'

function Protected({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth()
  if (loading) return <p className="center">Indlæser…</p>
  if (!me) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <Protected>
              <AppShell />
            </Protected>
          }
        >
          <Route path="/" element={<Navigate to="/overblik" replace />} />
          <Route path="/overblik" element={<OverblikPage />} />
          <Route path="/kalender" element={<KalenderPage />} />
          <Route path="/godkendelser" element={<GodkendelserPage />} />
          <Route path="/indstillinger/stedfortraeder" element={<DeputyPage />} />
          <Route path="/admin/brugere" element={<AdminUsersPage />} />
          <Route path="/admin/helligdage" element={<AdminHolidaysPage />} />
          <Route path="/admin/log" element={<AdminLogPage />} />
          <Route path="/mig/log" element={<MigLogPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
