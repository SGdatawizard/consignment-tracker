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

  const parts = partsFor(consignment.id, assignments)
  const available = specialists.filter((s) => !parts.some((p) => p.specialist_id === s.id))

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {parts.map((part) => (
        <PartRow
          key={part.id}
          part={part}
          specialists={specialists}
          canRemove={parts.length > 1}
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
            style={selectStyle}
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
            style={{ ...selectStyle, flex: '1 1 200px' }}
          />

          <button onClick={add} disabled={busy || !who} style={addButtonStyle(busy || !who)}>
            {busy ? 'Adding…' : 'Add'}
          </button>
          <button onClick={() => setAdding(false)} style={plainButtonStyle}>
            Cancel
          </button>
        </div>
      ) : (
        available.length > 0 && (
          <button onClick={() => setAdding(true)} style={plainButtonStyle}>
            Add another specialist
          </button>
        )
      )}
    </div>
  )
}

function PartRow({ part, specialists, canRemove, onUpdate, onRemove }) {
  const name = specialists.find((s) => s.id === part.specialist_id)?.full_name || 'Unknown'
  const days = daysWithSpecialist(part)

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
        flexWrap: 'wrap',
        borderLeft: `3px solid ${part.valued ? 'var(--success)' : 'var(--border-strong)'}`,
        paddingLeft: 'var(--space-3)',
      }}
    >
      <div style={{ minWidth: '150px' }}>
        <p style={{ fontSize: 'var(--size-sm)', fontWeight: 500 }}>{name}</p>
        <p style={{ fontSize: 'var(--size-xs)', color: part.valued ? 'var(--success)' : 'var(--text-muted)' }}>
          {part.valued ? 'Valued' : `Not valued · ${days} ${days === 1 ? 'day' : 'days'}`}
        </p>
      </div>

      <input
        defaultValue={part.remit}
        onBlur={(e) => {
          const next = e.target.value.trim()
          if (next !== part.remit) onUpdate(part.id, { remit: next })
        }}
        placeholder="What they are handling"
        aria-label={`What ${name} is handling`}
        style={{ ...selectStyle, flex: '1 1 200px' }}
      />

      {canRemove && (
        <button
          onClick={() => onRemove(part.id)}
          aria-label={`Remove ${name}`}
          style={{ ...plainButtonStyle, color: 'var(--danger)' }}
        >
          Remove
        </button>
      )}
    </div>
  )
}

const selectStyle = {
  height: '38px',
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 'var(--size-sm)',
}

const plainButtonStyle = {
  height: '38px',
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
  fontSize: 'var(--size-sm)',
  fontWeight: 500,
}

function addButtonStyle(disabled) {
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
