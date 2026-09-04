import { useState } from 'react'
import { useStore } from '../data/store'
import { SPECIALISTS } from '../data/users'
import Field, { inputStyle } from '../components/Field'
import { formatDateLong, plural } from '../lib/consignments'

const RECEIPT_PATTERN = /^R\d{7}$/

function today() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK = {
  receipt_number: '',
  vendor_name: '',
  box_count: '',
  arrival_date: today(),
  assigned_to: '',
}

export default function Auctions() {
  const { consignments, currentUser, addConsignment } = useStore()
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [confirmed, setConfirmed] = useState(null)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function validate() {
    const next = {}
    const receipt = form.receipt_number.trim().toUpperCase()

    if (!receipt) next.receipt_number = 'Enter a receipt number.'
    else if (!RECEIPT_PATTERN.test(receipt)) next.receipt_number = 'Receipt numbers look like R2000348 — an R followed by 7 digits.'
    else if (consignments.some((c) => c.receipt_number === receipt)) next.receipt_number = `${receipt} is already booked in.`

    if (!form.vendor_name.trim()) next.vendor_name = 'Enter a vendor name.'

    const boxes = Number(form.box_count)
    if (!form.box_count) next.box_count = 'Enter the number of boxes.'
    else if (!Number.isInteger(boxes) || boxes < 1) next.box_count = 'Enter a whole number of 1 or more.'

    if (!form.arrival_date) next.arrival_date = 'Enter the arrival date.'
    else if (form.arrival_date > today()) next.arrival_date = 'The arrival date cannot be in the future.'

    if (!form.assigned_to) next.assigned_to = 'Choose a specialist.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit() {
    if (!validate()) return
    const record = addConsignment({
      receipt_number: form.receipt_number.trim().toUpperCase(),
      vendor_name: form.vendor_name.trim(),
      box_count: Number(form.box_count),
      arrival_date: form.arrival_date,
      intake_specialist_id: currentUser.id,
      assigned_to: form.assigned_to,
    })
    setConfirmed(record)
    setForm({ ...BLANK, assigned_to: form.assigned_to })
  }

  const assignedName = SPECIALISTS.find((s) => s.id === confirmed?.assigned_to)?.full_name

  return (
    <>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Book in a consignment</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          Enter the details from the receipt. The specialist sees it straight away.
        </p>
      </header>

      {confirmed && (
        <div
          role="status"
          style={{
            background: 'var(--success-tint)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
            color: 'var(--success)',
          }}
        >
          <strong className="receipt">{confirmed.receipt_number}</strong>
          {' booked in and assigned to '}
          {assignedName}. Due back {formatDateLong(new Date(Date.now() + 30 * 86400000))}.
        </div>
      )}

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          padding: 'var(--space-5)',
          maxWidth: '620px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
        }}
      >
        <Field
          id="receipt"
          label="Receipt number"
          hint="As written on the receipt, for example R2000348."
          error={errors.receipt_number}
        >
          <input
            id="receipt"
            className="receipt"
            value={form.receipt_number}
            onChange={(e) => set('receipt_number', e.target.value)}
            placeholder="R2000348"
            autoComplete="off"
            aria-describedby="receipt-hint"
            aria-invalid={!!errors.receipt_number}
            style={{ ...inputStyle, fontSize: 'var(--size-lg)' }}
          />
        </Field>

        <Field id="vendor" label="Vendor name" error={errors.vendor_name}>
          <input
            id="vendor"
            value={form.vendor_name}
            onChange={(e) => set('vendor_name', e.target.value)}
            placeholder="Hartley Estate"
            list="known-vendors"
            autoComplete="off"
            aria-invalid={!!errors.vendor_name}
            style={inputStyle}
          />
          <datalist id="known-vendors">
            {[...new Set(consignments.map((c) => c.vendor_name))].sort().map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
          <Field id="boxes" label="Number of boxes" error={errors.box_count}>
            <input
              id="boxes"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={form.box_count}
              onChange={(e) => set('box_count', e.target.value)}
              aria-invalid={!!errors.box_count}
              style={inputStyle}
            />
          </Field>

          <Field id="arrived" label="Date of arrival" error={errors.arrival_date}>
            <input
              id="arrived"
              type="date"
              max={today()}
              value={form.arrival_date}
              onChange={(e) => set('arrival_date', e.target.value)}
              aria-invalid={!!errors.arrival_date}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field
          id="assigned"
          label="Specialist"
          hint="Who will be working on this consignment."
          error={errors.assigned_to}
        >
          <select
            id="assigned"
            value={form.assigned_to}
            onChange={(e) => set('assigned_to', e.target.value)}
            aria-describedby="assigned-hint"
            aria-invalid={!!errors.assigned_to}
            style={inputStyle}
          >
            <option value="">Choose a specialist</option>
            {SPECIALISTS.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </Field>

        <button
          onClick={submit}
          style={{
            height: 'var(--control-height-lg)',
            padding: '0 var(--space-6)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 700,
            fontSize: 'var(--size-base)',
            alignSelf: 'flex-start',
          }}
        >
          Book in consignment
        </button>
      </div>

      <RecentlyBookedIn consignments={consignments} />
    </>
  )
}

function RecentlyBookedIn({ consignments }) {
  const recent = consignments.slice(0, 5)
  if (recent.length === 0) return null

  return (
    <section style={{ marginTop: 'var(--space-7)', maxWidth: '620px' }}>
      <h2 style={{ fontSize: 'var(--size-lg)', marginBottom: 'var(--space-3)' }}>Recently booked in</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {recent.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--size-sm)',
            }}
          >
            <span className="receipt">{c.receipt_number}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {c.vendor_name} · {c.box_count} {plural(c.box_count, 'box')}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
