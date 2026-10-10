import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppShell() {
  const { me, logout } = useAuth()
  const roles = me?.roles ?? []
  const isManager = roles.includes('manager')
  const isAdmin = roles.includes('admin')

  return (
    <div className="shell">
      <header className="header">
        <div className="logo" aria-label="STAR Hub">
          <span className="logo-bar" aria-hidden />
          STAR <span>Hub</span>
        </div>
        <div className="header-right">
          <span>{me?.displayName}</span>
          <button type="button" className="btn-link" onClick={logout}>
            Log ud
          </button>
        </div>
      </header>
      <div className="body-row">
        <nav className="side-nav" aria-label="Hovedmenu">
          <p className="nav-section">Fravær</p>
          <NavLink to="/overblik">Overblik</NavLink>
          <NavLink to="/kalender">Teamkalender</NavLink>
          {isManager && <NavLink to="/godkendelser">Godkendelser</NavLink>}
          {isManager && <NavLink to="/indstillinger/stedfortraeder">Stedfortræder</NavLink>}
          {isAdmin && <p className="nav-section">Administration</p>}
          {isAdmin && <NavLink to="/admin/brugere">Medarbejdere og roller</NavLink>}
          {isAdmin && <NavLink to="/admin/helligdage">Helligdage</NavLink>}
          {isAdmin && <NavLink to="/admin/log">Ændringslog</NavLink>}
          <NavLink to="/mig/log">Min log</NavLink>
        </nav>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
