import Badge from './Badge'
import ToggleButton from './ToggleButton'
import { taskDueLabel, taskUrgency } from '../lib/tasks'

const TONE = {
  overdue: 'danger',
  soon: 'gold',
  ok: 'neutral',
  none: 'neutral',
  done: 'success',
}

export default function TaskCard({ task: t, onToggle, footer }) {
  const level = taskUrgency(t)

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${level === 'overdue' ? 'var(--danger)' : level === 'soon' ? 'var(--gold)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4) var(--space-5)',
        opacity: t.completed ? 0.75 : 1,
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
        <div style={{ flex: '1 1 240px' }}>
          <p style={{ fontWeight: 500, fontSize: 'var(--size-base)' }}>{t.title}</p>
          {t.detail && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: 'var(--space-1)' }}>
              {t.detail}
            </p>
          )}
        </div>
        <Badge tone={TONE[level]}>{t.completed ? 'Done' : taskDueLabel(t)}</Badge>
      </div>

      {onToggle && (
        <div style={{ marginTop: 'var(--space-4)', maxWidth: '280px' }}>
          <ToggleButton
            label="Completed"
            checked={t.completed}
            onChange={(v) => onToggle(t.id, v)}
          />
        </div>
      )}

      {footer && <div style={{ marginTop: 'var(--space-3)' }}>{footer}</div>}
    </article>
  )
}
