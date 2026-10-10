import { useEffect, useState } from 'react'
import { api } from '../api/client'

function weekStart(d: Date) {
  const x = new Date(d)
  const day = x.getDay() || 7
  if (day !== 1) x.setDate(x.getDate() - (day - 1))
  return x
}

function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function KalenderPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [data, setData] = useState<{ rows: { name: string; cells: { date: string; kind: string | null; pending: boolean }[] }[] } | null>(null)

  const from = iso(weekStart(anchor))
  const to = iso(addDays(weekStart(anchor), 4))

  useEffect(() => {
    void api<{ rows: { name: string; cells: { date: string; kind: string | null; pending: boolean }[] }[] }>(
      `/api/v1/calendar?from=${from}&to=${to}`,
    ).then(setData)
  }, [from, to])

  return (
    <>
      <h1>Teamkalender</h1>
      <div className="toolbar">
        <button type="button" className="btn btn-secondary" onClick={() => setAnchor(addDays(anchor, -7))}>‹</button>
        <button type="button" className="btn btn-secondary" onClick={() => setAnchor(new Date())}>I dag</button>
        <button type="button" className="btn btn-secondary" onClick={() => setAnchor(addDays(anchor, 7))}>›</button>
      </div>
      <p className="sub">Uge · {from} – {to}</p>
      {!data && <p>Henter…</p>}
      {data && (
        <div className="calendar-wrap">
          <table className="week-cal">
            <thead>
              <tr>
                <th>Navn</th>
                {data.rows[0]?.cells.map((c) => <th key={c.date}>{c.date.slice(5)}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  {r.cells.map((c) => (
                    <td key={c.date} className={c.kind ?? 'empty'} title={c.kind ?? ''}>
                      {c.pending ? '?' : code(c.kind)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function code(kind: string | null) {
  if (!kind) return '·'
  if (kind === 'sick') return 'S'
  if (kind === 'absent') return '–'
  if (kind === 'day_off') return 'F'
  if (kind === 'vacation') return 'Fe'
  return '·'
}
