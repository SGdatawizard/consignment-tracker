import { useMemo, useState } from 'react'
import { useHeldItems } from '../data/heldItems'
import { useStore } from '../data/store'
import Badge from '../components/Badge'
import Field, { inputStyle } from '../components/Field'
import { ErrorBar } from '../components/Loading'
import {
  daysHeld, collectionStatus, collectionLabel, matchesSearch, sortHeld,
} from '../lib/heldItems'
import { plural } from '../lib/consignments'

const TONE = { overdue: 'danger', soon: 'gold', ok: 'neutral', none: 'neutral', collected: 'success' }

const BLANK = {
  item_description: '',
  held_for: '',
  storage_location: '',
  expected_collection_date: '',
}

export default function HeldItems() {
  const { items, loading, error, dismissError, addItem, markCollected, undoCollected, updateItem } = useHeldItems()
  const { people } = useStore()

  const [query, setQuery] = useState('')
  const [showCollected, setShowCollected] = useState(false)
  const [adding, setAdding] = useState(false)

  const held = useMemo(() => items.filter((i) => !i.collected), [items])
  const collected = useMemo(() => items.filter((i) => i.collected), [items])

  const results = useMemo(() => {
    const pool = showCollected ? items : held
    return sortHeld(pool.filter((i) => matchesSearch(i, query)))
  }, [items, held, query, showCollected])

  const overdue = held.filter((i) => collectionStatus(i) === 'overdue').length

  return (
    <>
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Items held</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {held.length} {plural(held.length, 'item')} currently in the building
          {overdue > 0 && `, ${overdue} past their expected collection date`}
        </p>
      </header>

      <ErrorBar message={error} onDismiss={dismissError} />

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
        <div style={{ flex: '1 1 280px' }}>
          <label htmlFor="search" className="sr-only">Search items</label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by item, person or location"
            style={{ ...inputStyle, fontSize: 'var(--size-lg)' }}
          />
        </div>

        <button
          onClick={() => setAdding((v) => !v)}
          style={{
            height: 'var(--control-height-lg)',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 700,
          }}
        >
          {adding ? 'Close' : 'Log an item'}
        </button>
      </div>

      {adding && <AddForm onAdd={addItem} onDone={() => setAdding(false)} items={items} />}

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--size-sm)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <input
          type="checkbox"
          checked={showCollected}
          onChange={(e) => setShowCollected(e.target.checked)}
          style={{ width: '18px', height: '18px' }}
        />
        Include collected items ({collected.length})
      </label>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}

      {!loading && results.length === 0 && (
        <p
          style={{
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-5)',
            color: 'var(--text-muted)',
          }}
        >
          {query
            ? `Nothing matches "${query}". Try part of the person's name or the item.`
            : 'Nothing is being held at the moment.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {results.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            people={people}
            onCollect={markCollected}
            onUndo={undoCollected}
            onUpdate={updateItem}
          />
        ))}
      </div>
    </>
  )
}

function AddForm({ onAdd, onDone, items }) {
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function submit() {
    const next = {}
    if (!form.item_description.trim()) next.item_description = 'Describe what the item is.'
    if (!form.held_for.trim()) next.held_for = 'Enter who it is for.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const record = await onAdd(form)
    setBusy(false)
    if (!record) return

    setConfirmed(`${record.item_description} logged for ${record.held_for}.`)
    setForm(BLANK)
  }

  const knownLocations = [...new Set(items.map((i) => i.storage_location).filter(Boolean))].sort()

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-5)',
        maxWidth: '620px',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <h2 style={{ fontSize: 'var(--size-lg)' }}>Log an item</h2>

      {confirmed && (
        <p role="status" style={{ color: 'var(--success)', fontSize: 'var(--size-sm)' }}>
          {confirmed}
        </p>
      )}

      <Field id="item" label="What is it?" error={errors.item_description}>
        <input
          id="item"
          value={form.item_description}
          onChange={(e) => set('item_description', e.target.value)}
          placeholder="Brown leather folder, two albums"
          autoComplete="off"
          aria-invalid={!!errors.item_description}
          style={inputStyle}
        />
      </Field>

      <Field id="held-for" label="Who is it for?" error={errors.held_for}>
        <input
          id="held-for"
          value={form.held_for}
          onChange={(e) => set('held_for', e.target.value)}
          placeholder="Mr Fairbanks"
          autoComplete="off"
          aria-invalid={!!errors.held_for}
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <Field id="where" label="Where is it stored?" hint="Optional.">
          <input
            id="where"
            value={form.storage_location}
            onChange={(e) => set('storage_location', e.target.value)}
            placeholder="Add Location"
            list="held-locations"
            autoComplete="off"
            aria-describedby="where-hint"
            style={inputStyle}
          />
          <datalist id="held-locations">
            {knownLocations.map((v) => <option key={v} value={v} />)}
          </datalist>
        </Field>

        <Field id="expected" label="Expected collection" hint="Optional.">
          <input
            id="expected"
            type="date"
            value={form.expected_collection_date}
            onChange={(e) => set('expected_collection_date', e.target.value)}
            aria-describedby="expected-hint"
            style={inputStyle}
          />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button
          onClick={submit}
          disabled={busy}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 700,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Saving…' : 'Log item'}
        </button>
        <button
          onClick={onDone}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

function ItemRow({ item, people, onCollect, onUndo, onUpdate }) {
  const [collecting, setCollecting] = useState(false)
  const [note, setNote] = useState('')

  const status = collectionStatus(item)
  const days = daysHeld(item)
  const expected = collectionLabel(item)
  const loggedBy = people.find((p) => p.id === item.logged_by)
  const collectedBy = people.find((p) => p.id === item.collected_by)

  const accent = status === 'overdue' ? 'var(--danger)' : status === 'soon' ? 'var(--gold)' : 'var(--border)'

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${item.collected ? 'var(--success)' : accent}`,
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4) var(--space-5)',
        opacity: item.collected ? 0.75 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: '1 1 260px' }}>
          <p style={{ fontSize: 'var(--size-lg)', fontWeight: 500 }}>{item.item_description}</p>
          <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginTop: '2px' }}>
            For {item.held_for}
            {item.storage_location && ` · ${item.storage_location}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {item.collected ? (
            <Badge tone="success">Collected</Badge>
          ) : (
            <>
              {expected && <Badge tone={TONE[status]}>{expected}</Badge>}
              <Badge tone="neutral">Held {days} {plural(days, 'day')}</Badge>
            </>
          )}
        </div>
      </div>

      {!item.collected && (
        <div style={{ marginTop: 'var(--space-3)', maxWidth: '340px' }}>
          <label
            htmlFor={`loc-${item.id}`}
            style={{ display: 'block', fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}
          >
            Storage location
          </label>
          <input
            id={`loc-${item.id}`}
            defaultValue={item.storage_location || ''}
            placeholder="Add Location"
            onBlur={(e) => {
              const next = e.target.value.trim() || null
              if (next !== item.storage_location) onUpdate(item.id, { storage_location: next })
            }}
            style={{
              width: '100%',
              height: 'var(--control-height)',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
            }}
          />
        </div>
      )}

      <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
        Logged by {loggedBy?.full_name || 'unknown'} on{' '}
        {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        {item.collected && collectedBy && (
          <>
            {' · '}Handed over by {collectedBy.full_name} on{' '}
            {new Date(item.collected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </>
        )}
      </p>

      {item.handed_over_note && (
        <p
          style={{
            marginTop: 'var(--space-2)',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-2) var(--space-3)',
            fontSize: 'var(--size-sm)',
          }}
        >
          {item.handed_over_note}
        </p>
      )}

      {!item.collected && !collecting && (
        <button
          onClick={() => setCollecting(true)}
          style={{
            marginTop: 'var(--space-4)',
            height: 'var(--control-height)',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 500,
          }}
        >
          Mark as collected
        </button>
      )}

      {collecting && (
        <div
          style={{
            marginTop: 'var(--space-4)',
            background: 'var(--surface-sunken)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <label htmlFor={`note-${item.id}`} style={{ fontSize: 'var(--size-sm)', fontWeight: 500 }}>
            Who did you hand it to? (optional)
          </label>
          <input
            id={`note-${item.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Collected in person by Mr Fairbanks"
            style={{
              height: 'var(--control-height)',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-strong)',
              background: 'var(--surface)',
              fontSize: 'var(--size-sm)',
            }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <button
              onClick={() => { onCollect(item.id, note); setCollecting(false); setNote('') }}
              style={{
                height: 'var(--control-height)',
                padding: '0 var(--space-5)',
                borderRadius: 'var(--radius)',
                background: 'var(--success)',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              Confirm collected
            </button>
            <button
              onClick={() => { setCollecting(false); setNote('') }}
              style={{
                height: 'var(--control-height)',
                padding: '0 var(--space-4)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-strong)',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {item.collected && (
        <button
          onClick={() => onUndo(item.id)}
          style={{
            marginTop: 'var(--space-3)',
            fontSize: 'var(--size-sm)',
            color: 'var(--text-muted)',
            fontWeight: 500,
            textDecoration: 'underline',
          }}
        >
          Mark as still held
        </button>
      )}
    </article>
  )
}
