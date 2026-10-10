import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { VacationModal } from './components/VacationModal'
import type { VacationRequest } from './types/vacation'

function greeting() {
  const h = new Date().getHours()
  if (h < 10) return 'God morgen'
  if (h < 12) return 'God formiddag'
  if (h < 18) return 'God eftermiddag'
  return 'God aften'
}

function formatSent(iso: string) {
  return new Date(iso).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function App() {
  const [requests, setRequests] = useState<VacationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/vacation-requests')
      if (res.ok) {
        setRequests((await res.json()) as VacationRequest[])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRequests()
  }, [loadRequests])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3800)
    return () => window.clearTimeout(t)
  }, [toast])

  async function withdraw(id: string) {
    const res = await fetch(`/api/v1/vacation-requests/${id}/withdraw`, { method: 'POST' })
    if (res.ok) {
      setToast('Anmodning trukket tilbage.')
      await loadRequests()
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')

  return (
    <div className="shell">
      <header className="header">
        <div className="logo" aria-label="STAR Hub">
          <span className="logo-bar" aria-hidden />
          STAR <span>Hub</span>
        </div>
        <span>Jan Vinding</span>
      </header>

      <main className="main">
        <h1>
          {greeting()}, Jan
        </h1>
        <p className="sub">Fravær · ferieønske og anmodninger</p>

        <div className="action-grid">
          <button type="button" className="action-card" onClick={() => setModalOpen(true)}>
            <h2>Ferieønske</h2>
            <p>Send eller ret ønske – leder godkender</p>
          </button>
        </div>

        <section className="panel" aria-labelledby="mine-anmodninger">
          <h2 id="mine-anmodninger">Mine anmodninger og fravær</h2>
          {loading && <p className="empty">Henter…</p>}
          {!loading && requests.length === 0 && (
            <p className="empty">Ingen kommende registreringer.</p>
          )}
          {!loading &&
            requests.map((r) => (
              <div className="request-row" key={r.id}>
                <div>
                  <span className="chip">Ferie</span>
                  <p style={{ margin: '0.35rem 0 0' }}>{r.dateLabel}</p>
                  {r.status === 'pending' && (
                    <p className="status-line">
                      Afventer godkendelse · sendt {formatSent(r.createdAt)}
                    </p>
                  )}
                  {r.status === 'withdrawn' && (
                    <p className="status-line" style={{ color: 'var(--muted)' }}>
                      Trukket tilbage
                    </p>
                  )}
                </div>
                {r.status === 'pending' && (
                  <button type="button" className="btn-text" onClick={() => void withdraw(r.id)}>
                    Træk tilbage
                  </button>
                )}
              </div>
            ))}
        </section>

        {pending.length > 0 && (
          <p className="sub" style={{ marginTop: '1rem' }}>
            {pending.length} ferieanmodning{pending.length === 1 ? '' : 'er'} afventer godkendelse.
          </p>
        )}
      </main>

      <VacationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={() => {
          setToast('Anmodningen er sendt til din leder.')
          void loadRequests()
        }}
      />

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
