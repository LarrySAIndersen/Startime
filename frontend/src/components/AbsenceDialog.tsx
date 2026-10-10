import { useEffect, useState } from 'react'
import { api } from '../api/client'

type Mode = 'sick' | 'day_off' | 'vacation'

type Props = {
  mode: Mode
  open: boolean
  onClose: () => void
  onDone: (msg: string) => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const titles: Record<Mode, string> = {
  sick: 'Meld syg',
  day_off: 'Anmod om fri',
  vacation: 'Ferieønske',
}

export function AbsenceDialog({ mode, open, onClose, onDone }: Props) {
  const [start, setStart] = useState(today())
  const [end, setEnd] = useState(today())
  const [halfDay, setHalfDay] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStart(today())
    setEnd(today())
    setHalfDay(false)
    setError(null)
    setPreview(null)
  }, [open, mode])

  useEffect(() => {
    if (!open || mode === 'sick') return
    const q = new URLSearchParams({ start, end, type: mode })
    api<{ message: string }>(`/api/v1/absences/preview?${q}`)
      .then((p) => setPreview(p.message))
      .catch((e: Error) => {
        setPreview(null)
        setError(e.message)
      })
  }, [open, mode, start, end])

  if (!open) return null

  async function submit() {
    setError(null)
    try {
      if (mode === 'sick') {
        await api('/api/v1/absences/sick', {
          method: 'POST',
          body: JSON.stringify({ startDate: start }),
        })
        onDone('Du er meldt syg. Din leder er orienteret.')
      } else {
        await api('/api/v1/absences/requests', {
          method: 'POST',
          body: JSON.stringify({
            type: mode,
            startDate: start,
            endDate: end,
            halfDay: mode === 'day_off' && halfDay,
          }),
        })
        onDone('Anmodningen er sendt til din leder.')
      }
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fejl')
    }
  }

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h2>{titles[mode]}</h2>
        {mode === 'sick' ? (
          <>
            <div className="field">
              <label htmlFor="sick-from">Syg fra</label>
              <input id="sick-from" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="info-box grey">
              Gælder straks. Du skal ikke oplyse årsag.
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label htmlFor="from">Fra</label>
              <input id="from" type="date" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value > end) setEnd(e.target.value) }} />
            </div>
            <div className="field">
              <label htmlFor="to">Til og med</label>
              <input id="to" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
            </div>
            {mode === 'day_off' && start === end && (
              <label className="check-row">
                <input type="checkbox" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} />
                Kun halv dag
              </label>
            )}
            {preview && <p className="preview-line">{preview}</p>}
            <div className="info-box">
              Sendes til din leder til godkendelse. Du får besked, når den er behandlet, og kan rette den indtil da.
            </div>
          </>
        )}
        {error && <p className="alert" role="alert">{error}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annullér</button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()}>
            {mode === 'sick' ? 'Meld syg' : 'Send til godkendelse'}
          </button>
        </div>
      </div>
    </div>
  )
}
