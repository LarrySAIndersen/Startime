import { useEffect, useState } from 'react'
import { api } from '../api/client'

export function AdminUsersPage() {
  const [users, setUsers] = useState<unknown[]>([])
  useEffect(() => {
    void api<unknown[]>('/api/v1/admin/users?status=active').then(setUsers)
  }, [])
  return (
    <>
      <h1>Medarbejdere og roller</h1>
      <p className="sub">{Array.isArray(users) ? users.length : 0} aktive (Keycloak-admin i produktion)</p>
      <ul className="simple-list">
        {(users as { displayName: string; username: string; roles: string[] }[]).map((u) => (
          <li key={u.username}>{u.displayName} · {u.roles.join(', ')}</li>
        ))}
      </ul>
    </>
  )
}

export function AdminHolidaysPage() {
  const [year] = useState(new Date().getFullYear())
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([])
  useEffect(() => {
    void api<{ date: string; name: string }[]>(`/api/v1/admin/holidays?year=${year}`).then(setHolidays)
  }, [year])
  return (
    <>
      <h1>Helligdage {year}</h1>
      <ul className="simple-list">
        {holidays.map((h) => (
          <li key={h.date}>{h.date} — {h.name}</li>
        ))}
      </ul>
    </>
  )
}

export function AdminLogPage() {
  const [rows, setRows] = useState<{ at: string; action: string; entity: string }[]>([])
  useEffect(() => {
    void api<{ at: string; action: string; entity: string }[]>('/api/v1/admin/audit').then(setRows)
  }, [])
  return (
    <>
      <h1>Ændringslog</h1>
      <ul className="simple-list mono">
        {rows.map((r, i) => (
          <li key={i}>{new Date(r.at).toLocaleString('da-DK')} · {r.action} · {r.entity}</li>
        ))}
      </ul>
    </>
  )
}

export function MigLogPage() {
  const [data, setData] = useState<{ audit: unknown[]; access: unknown[] } | null>(null)
  useEffect(() => {
    void api<{ audit: unknown[]; access: unknown[] }>('/api/v1/me/log').then(setData)
  }, [])
  return (
    <>
      <h1>Min log</h1>
      <p className="sub">Hvem har ændret eller set dine data</p>
      {!data && <p>Henter…</p>}
      {data && (
        <>
          <h3>Ændringer</h3>
          <ul className="simple-list mono">
            {(data.audit as { at: string; action: string }[]).map((r, i) => (
              <li key={i}>{new Date(r.at).toLocaleString('da-DK')} · {r.action}</li>
            ))}
          </ul>
          <h3>Adgang</h3>
          <ul className="simple-list mono">
            {(data.access as { at: string; scope: string }[]).map((r, i) => (
              <li key={i}>{new Date(r.at).toLocaleString('da-DK')} · {r.scope}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

export function DeputyPage() {
  const [users, setUsers] = useState<{ id: string; displayName: string }[]>([])
  const [deputyId, setDeputyId] = useState('')
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    void api<{ id: string; displayName: string }[]>('/api/v1/demo/users').then(setUsers)
  }, [])

  async function save() {
    await api('/api/v1/deputies', {
      method: 'PUT',
      body: JSON.stringify([{ deputyId, validFrom: from, validTo: null }]),
    })
  }

  return (
    <>
      <h1>Stedfortræder</h1>
      <p className="sub">Angiv hvem der godkender, mens du er væk</p>
      <div className="field">
        <label htmlFor="dep">Stedfortræder</label>
        <select id="dep" value={deputyId} onChange={(e) => setDeputyId(e.target.value)}>
          <option value="">Vælg…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.displayName}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="vf">Fra dato</label>
        <input id="vf" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <button type="button" className="btn btn-primary" disabled={!deputyId} onClick={() => void save()}>
        Gem
      </button>
    </>
  )
}
