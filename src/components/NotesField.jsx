import { useEffect, useState } from 'react'
import { useStore } from '../data/store'

export default function NotesField({ consignment: c, canEdit }) {
  const { setNotes, people } = useStore()
  const [draft, setDraft] = useState(c.notes || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Pick up changes made elsewhere, as long as we aren't mid-edit
  useEffect(() => {
    if (!saving) setDraft(c.notes || '')
  }, [c.notes, c.notes_updated_at])

  const author = people.find((p) => p.id === c.notes_updated_by)
  const dirty = draft.trim() !== (c.notes || '')

  async function save() {
    if (!dirty) return
    setSaving(true)
    const ok = await setNotes(c.id, draft)
    setSaving(false)
    if (ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  if (!canEdit) {
    if (!c.notes) return null
    return (
      <div>
        <p style={{ fontWeight: 600, fontSize: 'var(--size-sm)', marginBottom: 'var(--space-2)' }}>
          Notes
        </p>
        <p
          style={{
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-3)',
            fontSize: 'var(--size-sm)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {c.notes}
        </p>
        {author && (
          <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            {author.full_name} · {whenLabel(c.notes_updated_at)}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <label
        htmlFor={`notes-${c.id}`}
        style={{ display: 'block', fontWeight: 600, fontSize: 'var(--size-sm)', marginBottom: 'var(--space-2)' }}
      >
        Notes
      </label>

      <textarea
        id={`notes-${c.id}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        rows={3}
        placeholder="Add a note about this consignment"
        style={{
          width: '100%',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          fontSize: 'var(--size-sm)',
          resize: 'vertical',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          minHeight: '20px',
        }}
      >
        <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', flex: 1 }}>
          {saving && 'Saving…'}
          {!saving && saved && <span style={{ color: 'var(--success)' }}>Saved</span>}
          {!saving && !saved && dirty && 'Unsaved — click away to save'}
          {!saving && !saved && !dirty && author && `Last updated by ${author.full_name} · ${whenLabel(c.notes_updated_at)}`}
        </p>

        {dirty && (
          <button
            onClick={save}
            style={{
              height: '32px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius)',
              background: 'var(--navy)',
              color: 'var(--text-on-dark)',
              fontSize: 'var(--size-xs)',
              fontWeight: 500,
            }}
          >
            Save
          </button>
        )}
      </div>
    </div>
  )
}

function whenLabel(iso) {
  if (!iso) return ''
  const then = new Date(iso)
  const mins = Math.floor((Date.now() - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
