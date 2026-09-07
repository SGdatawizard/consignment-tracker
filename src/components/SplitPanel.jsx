import { useState } from 'react'
import { useStore } from '../data/store'
import { daysWithSpecialist } from '../lib/consignments'
import { partsFor } from '../lib/assignments'

export default function SplitPanel({ consignment }) {
  const { assignments, specialists, addAssignment, updateAssignment, removeAssignment } = useStore()
  const [adding, setAdding] = useState(false)
  const [who, setWho] = useState('')
  const [remit, setRemit] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(null)

  const parts = partsFor(consignment.id, assignments)
  const takenIds = parts.map((p) => p.specialist_id)
  const available = specialists.filter((s) => !takenIds.includes(s.id))

  async function add() {
    if (!who) return
    setBusy(true)
    const ok = await addAssignment(consignment.id, who, remit)
    setBusy(false)
    if (ok) {
      setWho('')
      setRemit('')
      setAdding(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {parts.map((part) => (
        <PartRow
          key={part.id}
          part={part}
          specialists={specialists}
          takenIds={takenIds}
          canRemove={parts.length > 1}
          confirming={confirmRemove === part.id}
          onConfirm={() => setConfirmRemove(part.id)}
          onCancelConfirm={() => setConfirmRemove(null)}
          onUpdate={updateAssignment}
          onRemove={removeAssignment}
        />
      ))}

      {adding ? (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            alignItems: 'center',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-3)',
          }}
        >
          <select
            value={who}
            onChange={(e) => setWho(e.target.value)}
            aria-label="Specialist to add"
            style={controlStyle}
          >
            <option value="">Choose a specialist</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>

          <input
            value={remit}
            onChange={(e) => setRemit(e.target.value)}
            placeholder="What they are handling"
            aria-label="What they are handling"
            style={{ ...controlStyle, flex: '1 1 200px' }}
          />

          <button onClick={add} disabled={busy || !who} style={primaryStyle(busy || !who)}>
            {busy ? 'Adding…' : 'Add'}
          </button>
          <button onClick={() => setAdding(false)} style={plainStyle}>
            Cancel
          </button>
        </div>
      ) : (
        available.length > 0 && (
          <button onClick={() => setAdding(true)} style={plainStyle}>
            Add another specialist
          </button>
        )
      )}
    </div>
  )
}

function PartRow({
  part, specialists, takenIds, canRemove,
  confirming, onConfirm, onCancelConfirm, onUpdate, onRemove,
}) {
  const name = specialists.find((s) => s.id === part.specialist_id)?.full_name || 'Unknown'
  const days = daysWithSpecialist(part)

  // Anyone already on this consignment can't be picked, except this row's own person
  const options = specialists.filter(
    (s) => s.id === part.specialist_id || !takenIds.includes(s.id)
  )

  return (
    <div
      style={{
        borderLeft: `3px solid ${part.valued ? 'var(--success)' : 'var(--border-strong)'}`,
        paddingLeft: 'var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
        <label htmlFor={`who-${part.id}`} className="sr-only">Specialist</label>
        <select
          id={`who-${part.id}`}
          value={part.specialist_id}
          onChange={(e) => onUpdate(part.id, { specialist_id: e.target.value })}
          style={{ ...controlStyle, minWidth: '170px' }}
        >
          {options.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </select>

        <label htmlFor={`remit-${part.id}`} className="sr-only">
          What {name} is handling
        </label>
        <input
          id={`remit-${part.id}`}
          defaultValue={part.remit}
          onBlur={(e) => {
            const next = e.target.value.trim()
            if (next !== part.remit) onUpdate(part.id, { remit: next })
          }}
          placeholder="What they are handling"
          style={{ ...controlStyle, flex: '1 1 200px' }}
        />

        {canRemove && !confirming && (
          <button onClick={onConfirm} style={{ ...plainStyle, color: 'var(--danger)' }}>
            Remove
          </button>
        )}
      </div>

      {confirming && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'var(--danger-tint)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-2) var(--space-3)',
          }}
        >
          <span style={{ fontSize: 'var(--size-sm)', color: 'var(--danger)' }}>
            Take {name} off this consignment?
          </span>
          <button
            onClick={() => { onRemove(part.id); onCancelConfirm() }}
            style={{ ...plainStyle, background: 'var(--danger)', color: '#FFFFFF', border: 'none' }}
          >
            Remove
          </button>
          <button onClick={onCancelConfirm} style={plainStyle}>
            Cancel
          </button>
        </div>
      )}

      <p style={{ fontSize: 'var(--size-xs)', color: part.valued ? 'var(--success)' : 'var(--text-muted)' }}>
        {part.valued ? 'Valued' : `Not valued · ${days} ${days === 1 ? 'day' : 'days'} with them`}
      </p>
    </div>
  )
}

const controlStyle = {
  height: '38px',
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 'var(--size-sm)',
}

const plainStyle = {
  height: '38px',
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 'var(--size-sm)',
  fontWeight: 500,
}

function primaryStyle(disabled) {
  return {
    height: '38px',
    padding: '0 var(--space-4)',
    borderRadius: 'var(--radius)',
    background: 'var(--navy)',
    color: 'var(--text-on-dark)',
    fontSize: 'var(--size-sm)',
    fontWeight: 500,
    opacity: disabled ? 0.5 : 1,
  }
}
