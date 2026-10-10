import { useEffect, useState } from 'react'
import './App.css'

type Health = {
  ok: boolean
  service: string
  timestamp: string
}

type Status = {
  app: string
  stack: string[]
  message: string
}

function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [status, setStatus] = useState<Status | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [healthRes, statusRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/status'),
        ])
        if (!healthRes.ok || !statusRes.ok) {
          throw new Error('API svarede ikke OK')
        }
        setHealth(await healthRes.json())
        setStatus(await statusRes.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    }
    void load()
  }, [])

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">React + .NET</p>
        <h1>Startime</h1>
        <p className="lead">
          Helt ny app med React-frontend og ASP.NET Core API — samme Cloud Agent-opsætning som
          jeres andre projekter.
        </p>
      </header>

      <section className="cards">
        <article className="card">
          <h2>Frontend</h2>
          <p>Vite + React + TypeScript på port 4319</p>
        </article>
        <article className="card">
          <h2>Backend</h2>
          <p>ASP.NET Core 8 Web API på port 5080</p>
        </article>
      </section>

      <section className="card status">
        <h2>Live fra API</h2>
        {error && <p className="error">{error}</p>}
        {!error && !health && <p>Henter data…</p>}
        {health && status && (
          <dl>
            <div>
              <dt>Health</dt>
              <dd>{health.ok ? 'OK' : 'Fejl'} — {health.service}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{status.message}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{status.stack.join(' · ')}</dd>
            </div>
            <div>
              <dt>Tid (UTC)</dt>
              <dd>{new Date(health.timestamp).toLocaleString('da-DK')}</dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  )
}

export default App
