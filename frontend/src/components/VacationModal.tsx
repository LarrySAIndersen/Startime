import { useEffect, useId, useState } from 'react'
import type { VacationPreview } from '../types/vacation'

type Props = {
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function VacationModal({ open, onClose, onSubmitted }: Props) {
  const titleId = useId()
  const [startDate, setStartDate] = useState(todayIso())
  const [endDate, setEndDate] = useState(todayIso())
  const [preview, setPreview] = useState<VacationPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStartDate(todayIso())
    setEndDate(todayIso())
    setPreview(null)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    async function loadPreview() {
      try {
        const res = await fetch('/api/v1/vacation-requests/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const body = (await res.json()) as { detail?: string }
          setPreview(null)
          setError(body.detail ?? 'Kunne ikke beregne perioden.')
          return
        }
        setError(null)
        setPreview((await res.json()) as VacationPreview)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setError('Kunne ikke kontakte API.')
        }
      }
    }
    void loadPreview()
    return () => controller.abort()
  }, [open, startDate, endDate])

  if (!open) return null

  async function submit() {
    if (!startDate) {
      setError('Vælg en startdato.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/vacation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string }
        setError(body.detail ?? 'Kunne ikke sende anmodningen.')
        return
      }
      onSubmitted()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>Ferieønske</h2>
        <div className="field">
          <label htmlFor="vacation-from">Fra</label>
          <input
            id="vacation-from"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              if (e.target.value > endDate) setEndDate(e.target.value)
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="vacation-to">Til og med</label>
          <input
            id="vacation-to"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {preview && <p className="preview-line">{preview.message}</p>}
        <div className="info-box">
          Sendes til din leder til godkendelse. Du får besked, når den er behandlet, og kan rette den
          indtil da.
        </div>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annullér
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting || !preview}
            onClick={() => void submit()}
          >
            Send til godkendelse
          </button>
        </div>
      </div>
    </div>
  )
}
