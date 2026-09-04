import { useMemo } from 'react'
import { useStore } from '../data/store'
import ConsignmentCard from '../components/ConsignmentCard'
import TaskCard from '../components/TaskCard'
import { deriveStatus, sortByUrgency, STATUS, formatDate, plural } from '../lib/consignments'
import { sortTasks } from '../lib/tasks'

export default function MyWork() {
  const { consignments, tasks, currentUser, toggleFlag, toggleTask, setStorageLocation } = useStore()

  const mine = useMemo(
    () => consignments.filter((c) => c.assigned_to === currentUser.id),
    [consignments, currentUser.id]
  )

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigned_to === currentUser.id),
    [tasks, currentUser.id]
  )

  const openTasks = sortTasks(myTasks.filter((t) => !t.completed))
  const doneTasks = myTasks
    .filter((t) => t.completed)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  const inProgress = sortByUrgency(mine.filter((c) => deriveStatus(c) === STATUS.IN_PROGRESS))
  const awaiting = mine.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR)
  const complete = mine
    .filter((c) => deriveStatus(c) === STATUS.COMPLETE)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))

  const nothingAtAll = mine.length === 0 && myTasks.length === 0

  return (
    <>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Your consignments</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {currentUser.full_name} · {inProgress.length} in progress, {awaiting.length} awaiting vendor
          {openTasks.length > 0 && `, ${openTasks.length} ${plural(openTasks.length, 'task')}`}
        </p>
      </header>

      {nothingAtAll && (
        <Empty>Nothing is assigned to you at the moment.</Empty>
      )}

      {openTasks.length > 0 && (
        <Section title="Tasks" count={openTasks.length}>
          {openTasks.map((t) => (
            <TaskCard key={t.id} task={t} onToggle={toggleTask} />
          ))}
        </Section>
      )}

      {doneTasks.length > 0 && (
        <details style={{ marginBottom: 'var(--space-6)' }}>
          <summary
            style={{
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: 'var(--size-sm)',
              padding: 'var(--space-2) 0',
            }}
          >
            Completed tasks ({doneTasks.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
            {doneTasks.map((t) => (
              <TaskCard key={t.id} task={t} onToggle={toggleTask} />
            ))}
          </div>
        </details>
      )}

      {mine.length > 0 && (
        <Section title="In progress" count={inProgress.length}>
          {inProgress.map((c) => (
            <ConsignmentCard key={c.id} consignment={c} onToggle={toggleFlag} />
          ))}
          {inProgress.length === 0 && (
            <Empty>No consignments waiting on you right now.</Empty>
          )}
        </Section>
      )}

      {awaiting.length > 0 && (
        <Section title="Awaiting vendor" count={awaiting.length}>
          {awaiting.map((c) => (
            <ConsignmentCard key={c.id} consignment={c} onToggle={toggleFlag} />
          ))}
        </Section>
      )}

      {complete.length > 0 && (
        <Section title="Complete" count={complete.length}>
          {complete.map((c) => (
            <ConsignmentCard
              key={c.id}
              consignment={c}
              footer={<StorageField consignment={c} onSave={setStorageLocation} />}
            />
          ))}
        </Section>
      )}
    </>
  )
}

function Section({ title, count, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-7)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        <h2>{title}</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {children}
      </div>
    </section>
  )
}

function Empty({ children }) {
  return (
    <p
      style={{
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-5)',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </p>
  )
}

function StorageField({ consignment: c, onSave }) {
  const completedOn = c.completed_at ? formatDate(c.completed_at) : null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 220px' }}>
        <label
          htmlFor={`loc-${c.id}`}
          style={{ display: 'block', fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}
        >
          Storage location
        </label>
        <input
          id={`loc-${c.id}`}
          defaultValue={c.storage_location || ''}
          placeholder="Bay 3, shelf B"
          onBlur={(e) => onSave(c.id, e.target.value.trim())}
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
      {completedOn && (
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', paddingBottom: 'var(--space-3)' }}>
          Completed {completedOn}
        </p>
      )}
    </div>
  )
}
