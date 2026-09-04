import { useState } from 'react'
import { useStore } from '../data/store'
import { SPECIALISTS } from '../data/users'
import Field, { inputStyle } from './Field'

const BLANK = { title: '', detail: '', assigned_to: '', due_date: '' }

export default function NewTaskForm() {
  const { addTask } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [errors, setErrors] = useState({})
  const [confirmed, setConfirmed] = useState(null)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function submit() {
    const next = {}
    if (!form.title.trim()) next.title = 'Give the task a name.'
    if (!form.assigned_to) next.assigned_to = 'Choose a specialist.'
    setErrors(next)
    if (Object.keys(next).length) return

    const record = addTask(form)
    const who = SPECIALISTS.find((s) => s.id === record.assigned_to)?.full_name
    setConfirmed(`${record.title} assigned to ${who}. They've been emailed.`)
    setForm({ ...BLANK, assigned_to: form.assigned_to })
  }

  if (!open) {
    return (
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 500,
          }}
        >
          Add a task
        </button>
        {confirmed && (
          <p role="status" style={{ color: 'var(--success)', fontSize: 'var(--size-sm)', marginTop: 'var(--space-3)' }}>
            {confirmed}
          </p>
        )}
      </div>
    )
  }

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
      <h2 style={{ fontSize: 'var(--size-lg)' }}>Add a task</h2>

      {confirmed && (
        <p role="status" style={{ color: 'var(--success)', fontSize: 'var(--size-sm)' }}>
          {confirmed}
        </p>
      )}

      <Field id="task-title" label="Task" error={errors.title}>
        <input
          id="task-title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="S26010 unsolds"
          autoComplete="off"
          aria-invalid={!!errors.title}
          style={inputStyle}
        />
      </Field>

      <Field id="task-detail" label="Detail" hint="Optional. Anything they need to know.">
        <textarea
          id="task-detail"
          value={form.detail}
          onChange={(e) => set('detail', e.target.value)}
          rows={2}
          aria-describedby="task-detail-hint"
          style={{ ...inputStyle, height: 'auto', padding: 'var(--space-3) var(--space-4)', resize: 'vertical' }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
        <Field id="task-assigned" label="Specialist" error={errors.assigned_to}>
          <select
            id="task-assigned"
            value={form.assigned_to}
            onChange={(e) => set('assigned_to', e.target.value)}
            aria-invalid={!!errors.assigned_to}
            style={inputStyle}
          >
            <option value="">Choose a specialist</option>
            {SPECIALISTS.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </Field>

        <Field id="task-due" label="Due date" hint="Optional.">
          <input
            id="task-due"
            type="date"
            value={form.due_date}
            onChange={(e) => set('due_date', e.target.value)}
            aria-describedby="task-due-hint"
            style={inputStyle}
          />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button
          onClick={submit}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-5)',
            borderRadius: 'var(--radius)',
            background: 'var(--navy)',
            color: 'var(--text-on-dark)',
            fontWeight: 700,
          }}
        >
          Create task
        </button>
        <button
          onClick={() => { setOpen(false); setForm(BLANK); setErrors({}) }}
          style={{
            height: 'var(--control-height)',
            padding: '0 var(--space-4)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-strong)',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
