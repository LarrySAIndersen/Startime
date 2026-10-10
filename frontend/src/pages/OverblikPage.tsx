import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AbsenceDialog } from '../components/AbsenceDialog'

type Absence = {
  id: string
  type: string
  status: string
  startDate: string
  endDate: string | null
  version: number
  submittedAt: string
  rejectionReason?: string | null
}

export function OverblikPage() {
  const { me, refresh } = useAuth()
  const [items, setItems] = useState<Absence[]>([])
  const [dialog, setDialog] = useState<'sick' | 'day_off' | 'vacation' | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setItems(await api<Absence[]>('/api/v1/me/absences'))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3800)
    return () => clearTimeout(t)
  }, [toast])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 10) return 'God morgen'
    if (h < 12) return 'God formiddag'
    if (h < 18) return 'God eftermiddag'
    return 'God aften'
  }

  async function withdraw(id: string, version: number) {
    await api(`/api/v1/absences/requests/${id}/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    })
    setToast('Anmodning trukket tilbage.')
    await load()
  }

  async function recover(id: string) {
    await api(`/api/v1/absences/sick/${id}/recover`, { method: 'POST', body: '{}' })
    setToast('Du er raskmeldt fra i morgen. God bedring.')
    await load()
  }

  const pendingCount = items.filter((i) => i.status === 'pending').length

  return (
    <>
      <h1>{greeting()}, {me?.givenName}</h1>
      <p className="sub">{me?.team?.name ?? '—'} · fraværsoverblik</p>

      {me?.roles.includes('manager') && pendingCount > 0 && (
        <div className="leader-banner">
          <strong>{pendingCount} anmodning{pendingCount === 1 ? '' : 'er'} venter på dig</strong>
          <p>Fri og ferie kræver din godkendelse. Sygdom registreres direkte.</p>
          <Link to="/godkendelser" className="btn btn-secondary">Gå til godkendelser</Link>
        </div>
      )}

      <div className="action-grid">
        <button type="button" className="action-card sick" onClick={() => setDialog('sick')}>
          <h2>Meld syg</h2>
          <p>Gælder straks – ingen godkendelse</p>
        </button>
        <button type="button" className="action-card dayoff" onClick={() => setDialog('day_off')}>
          <h2>Anmod om fri</h2>
          <p>En dag eller en periode – leder godkender</p>
        </button>
        <button type="button" className="action-card vacation" onClick={() => setDialog('vacation')}>
          <h2>Ferieønske</h2>
          <p>Send eller ret ønske – leder godkender</p>
        </button>
      </div>

      <section className="panel">
        <h2>Mine anmodninger og fravær</h2>
        {items.length === 0 && <p className="empty">Ingen kommende registreringer.</p>}
        {items.map((a) => (
          <div className="request-row" key={a.id}>
            <div>
              <span className={`chip ${a.type}`}>{labelType(a.type)}</span>
              <p>{a.startDate}{a.endDate && a.endDate !== a.startDate ? ` – ${a.endDate}` : ''}</p>
              <p className="status-line">{statusText(a)}</p>
              {a.rejectionReason && <div className="reason-box">{a.rejectionReason}</div>}
            </div>
            <div className="row-actions">
              {a.type === 'sick' && a.status === 'registered' && !a.endDate && (
                <button type="button" className="btn btn-primary" onClick={() => void recover(a.id)}>Meld rask</button>
              )}
              {a.status === 'pending' && a.type !== 'sick' && (
                <button type="button" className="btn-text" onClick={() => void withdraw(a.id, a.version)}>Træk tilbage</button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="panel muted-panel">
        <h2>Min ferie {new Date().getFullYear()}</h2>
        <p className="empty">Saldoen kommer fra Statens HR (fase 3).</p>
      </section>

      <AbsenceDialog
        mode={dialog ?? 'vacation'}
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onDone={(msg) => {
          setToast(msg)
          void load()
          void refresh()
        }}
      />
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  )
}

function labelType(t: string) {
  if (t === 'day_off') return 'Fri'
  if (t === 'vacation') return 'Ferie'
  if (t === 'sick') return 'Syg'
  return 'Fraværende'
}

function statusText(a: Absence) {
  if (a.status === 'registered' && !a.endDate) return 'Aktiv nu'
  if (a.status === 'pending') return `Afventer godkendelse · sendt ${new Date(a.submittedAt).toLocaleDateString('da-DK')}`
  if (a.status === 'approved') return 'Godkendt'
  if (a.status === 'rejected') return 'Afvist af leder – ret og send igen'
  if (a.status === 'withdrawn') return 'Trukket tilbage'
  return a.status
}
