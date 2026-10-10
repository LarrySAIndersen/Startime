import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

type DemoUser = { id: string; displayName: string; username: string; roles: string[] }

export function LoginPage() {
  const { loginAs, me } = useAuth()
  const nav = useNavigate()
  const [users, setUsers] = useState<DemoUser[]>([])

  useEffect(() => {
    if (me) nav('/overblik')
  }, [me, nav])

  useEffect(() => {
    void api<DemoUser[]>('/api/v1/demo/users').then(setUsers)
  }, [])

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo dark">
          <span className="logo-bar" aria-hidden />
          STAR <span>Hub</span>
        </div>
        <h1>Log ind</h1>
        <p className="muted">
          Brug din STAR-konto. Login håndteres af STAR SSO (Keycloak) med tofaktor.
        </p>
        <p className="demo-note">Demo: vælg bruger (erstatter Keycloak i VM).</p>
        <ul className="user-pick">
          {users.map((u) => (
            <li key={u.id}>
              <button type="button" className="btn btn-primary pick-btn" onClick={() => void loginAs(u.id)}>
                Log ind som {u.displayName}
              </button>
            </li>
          ))}
        </ul>
        <p className="small muted">Data opbevares i Danmark/EU.</p>
        <p className="small muted">Kan du ikke logge ind? Ring eller sms til din leder.</p>
      </div>
    </div>
  )
}
