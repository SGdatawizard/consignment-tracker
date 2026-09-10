import { useMemo } from 'react'
import { useStore } from '../data/store'
import ConsignmentCard from '../components/ConsignmentCard'
import TaskCard from '../components/TaskCard'
import LocationField from '../components/LocationField'
import Badge from '../components/Badge'
import { deriveStatus, sortByUrgency, STATUS, formatDate, plural } from '../lib/consignments'
import { consignmentsFor } from '../lib/assignments'
import { sortTasks } from '../lib/tasks'
import { daysSince } from '../lib/chase'

export default function MyWork() {
  const {
    consignments, assignments, tasks, people, chaser, isChaser,
    currentUserId, currentUser,
    setMyValued, setSharedFlag, setNeedsChasing, markChased,
    toggleTask, setStorageLocation,
  } = useStore()

  const mine = useMemo(
    () => consignmentsFor(currentUserId, consignments, assignments),
    [consignments, assignments, currentUserId]
  )

  const toChase = useMemo(
    () => (isChaser ? consignments.filter((c) => c.needs_chasing) : []),
    [consignments, isChaser]
  )

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assigned_to === currentUserId),
    [tasks, currentUserId]
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

  const nothingAtAll = mine.length === 0 && myTasks.length === 0 && toChase.length === 0

  const cardProps = {
    assignments,
    people,
    currentUserId,
    chaser,
    onSetMyValued: setMyValued,
    onSetSharedFlag: setSharedFlag,
    onSetNeedsChasing: setNeedsChasing,
  }

  return (
    <>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1>Your consignments</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {currentUser.full_name} · {inProgress.length} in progress, {awaiting.length} awaiting vendor
          {openTasks.length > 0 && `, ${openTasks.length} ${plural(openTasks.length, 'task')}`}
          {toChase.length > 0 && `, ${toChase.length} to chase`}
        </p>
      </header>

      {nothingAtAll && <Empty>Nothing is assigned to you at the moment.</Empty>}

      {toChase.length > 0 && (
        <Section title="To chase" count={toChase.length}>
          {toChase.map((c) => (
            <ChaseCard key={c.id} consignment={c} onChased={markChased} />
          ))}
        </Section>
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
            <ConsignmentCard key={c.id} consignment={c} {...cardProps} />
          ))}
          {inProgress.length === 0 && <Empty>No consignments waiting on you right now.</Empty>}
        </Section>
      )}

      {awaiting.length > 0 && (
        <Section title="Awaiting vendor" count={awaiting.length}>
          {awaiting.map((c) => (
            <ConsignmentCard key={c.id} consignment={c} {...cardProps} />
          ))}
        </Section>
      )}

      {complete.length > 0 && (
        <Section title="Complete" count={complete.length}>
          {complete.map((c) => (
            <ConsignmentCard
              key={c.id}
              consignment={c}
              {...cardProps}
              footer={<CompleteFooter consignment={c} onSave={setStorageLocation} />}
            />
          ))}
        </Section>
      )}
    </>
  )
}

function ChaseCard({ consignment: c, onChased }) {
  const waitingDays = daysSince(c.awaiting_vendor_at)
  const askedDays = daysSince(c.chase_requested_at)
  const lastChased = daysSince(c.last_chased_at)

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--gold)',
        borderLeft: '4px solid var(--gold)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
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
        <div>
          <p className="receipt" style={{ fontSize: 'var(--size-lg)' }}>{c.receipt_number}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: '2px' }}>
            {c.vendor_name} · {c.box_count} {plural(c.box_count, 'box')}
          </p>
        </div>
        <Badge tone="gold">
          {waitingDays !== null ? `Waiting ${waitingDays} ${plural(waitingDays, 'day')}` : 'Awaiting vendor'}
        </Badge>
      </div>

      <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
        {askedDays === 0
          ? 'Chase requested today.'
          : `Chase requested ${askedDays} ${plural(askedDays, 'day')} ago.`}
        {lastChased !== null && ` Last chased ${lastChased} ${plural(lastChased, 'day')} ago.`}
      </p>

      <button
        onClick={() => onChased(c.id)}
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
        Mark as chased
      </button>
    </article>
  )
}

function CompleteFooter({ consignment: c, onSave }) {
  const completedOn = c.completed_at ? formatDate(c.completed_at) : null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
      <LocationField consignment={c} onSave={onSave} compact />
      {completedOn && (
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', paddingBottom: 'var(--space-3)' }}>
          Completed {completedOn}
        </p>
      )}
    </div>
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
