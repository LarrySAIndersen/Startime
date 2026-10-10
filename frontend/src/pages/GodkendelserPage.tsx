import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Item = {
  absence: { id: string; version: number; startDate: string; endDate: string | null; type: string }
  employeeName: string
  submittedAt: string
}

export function GodkendelserPage() {
  const [items, setItems] = useState<Item[]>([])
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [version, setVersion] = useState(0)

  async function load() {
    setItems(await api<Item[]>('/api/v1/approvals?status=pending'))
  }

  useEffect(() => {
    void load()
  }, [])

  async function approve(id: string, ver: number) {
    await api(`/api/v1/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ version: ver }),
    })
    await load()
  }

  async function reject() {
    if (!rejectId) return
    await api(`/api/v1/approvals/${rejectId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ version, reason }),
    })
    setRejectId(null)
    setReason('')
    await load()
  }

  return (
    <>
      <h1>Godkendelser</h1>
      <p className="sub">Anmodninger om fri og ferie fra dit team</p>
      {items.length === 0 && <p className="empty">Ingen anmodninger venter.</p>}
      {items.map((it) => (
        <article className="panel approval-card" key={it.absence.id}>
          <h3>{it.employeeName}</h3>
          <p>{label(it.absence.type)} · {it.absence.startDate}{it.absence.endDate ? ` – ${it.absence.endDate}` : ''}</p>
          <p className="muted">Sendt {new Date(it.submittedAt).toLocaleDateString('da-DK')}</p>
          <div className="dialog-actions">
            <button type="button" className="btn btn-primary" onClick={() => void approve(it.absence.id, it.absence.version)}>
              Godkend
            </button>
            <button
              type="button"
              className="btn btn-secondary reject"
              onClick={() => {
                setRejectId(it.absence.id)
                setVersion(it.absence.version)
              }}
            >
              Afvis
            </button>
          </div>
        </article>
      ))}

      {rejectId && (
        <div className="overlay">
          <div className="dialog">
            <h2>Afvis anmodning</h2>
            <label className="field">
              Begrundelse
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} />
            </label>
            <p className="small muted">Medarbejderen ser begrundelsen. Skriv ikke helbredsoplysninger.</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setRejectId(null)}>Annullér</button>
              <button type="button" className="btn btn-primary reject" onClick={() => void reject()}>Afvis</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function label(t: string) {
  return t === 'day_off' ? 'Fri' : t === 'vacation' ? 'Ferie' : t
}
