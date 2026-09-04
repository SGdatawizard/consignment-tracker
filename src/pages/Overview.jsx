import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import StatTile from '../components/StatTile'
import Badge from '../components/Badge'
import TaskCard from '../components/TaskCard'
import NewTaskForm from '../components/NewTaskForm'
import { useAuth, CAN } from '../data/auth'
import {
  deriveStatus, STATUS, STATUS_LABEL, urgency, countdownLabel,
  daysInDept, daysWithCurrentSpecialist, wasReassigned,
  nextAction, sortByUrgency, formatDate, plural,
} from '../lib/consignments'
import { sortTasks, taskUrgency } from '../lib/tasks'

export default function Overview() {
  const { consignments, tasks, history, specialists, reassign, reassignTask } = useStore()
  const { profile } = useAuth()
  const canManage = CAN.manage(profile.role)

  const [filter, setFilter] = useState('open')
  const [groupBySpecialist, setGroupBySpecialist] = useState(true)

  const open = consignments.filter((c) => deriveStatus(c) !== STATUS.COMPLETE)
  const openTasks = tasks.filter((t) => !t.completed)

  const stats = useMemo(() => ({
    open: open.length,
    inProgress: open.filter((c) => deriveStatus(c) === STATUS.IN_PROGRESS).length,
    awaiting: open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR).length,
    overdue: open.filter((c) => urgency(c) === 'overdue').length,
    soon: open.filter((c) => urgency(c) === 'soon').length,
    tasks: openTasks.length,
    tasksOverdue: openTasks.filter((t) => taskUrgency(t) === 'overdue').length,
    noLocation: consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE && !c.storage_location).length,
  }), [consignments, open, openTasks])

  const visible = useMemo(() => {
    let list = consignments
    if (filter === 'open') list = open
    if (filter === 'overdue') list = open.filter((c) => urgency(c) === 'overdue')
    if (filter === 'awaiting') list = open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR)
    if (filter === 'complete') list = consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE)
    if (filter === 'no_location') list = consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE && !c.storage_location)
    if (filter === 'tasks') list = []
    return sortByUrgency(list)
  }, [consignments, open, filter])

  const groups = useMemo(() => {
    if (!groupBySpecialist) return [{ id: 'all', name: null, items: visible }]
    const assigned = specialists.map((s) => ({
      id: s.id,
      name: s.full_name,
      items: visible.filter((c) => c.assigned_to === s.id),
    }))
    const unassigned = visible.filter((c) => !specialists.some((s) => s.id === c.assigned_to))
    if (unassigned.length) {
      assigned.push({ id: 'none', name: 'Unassigned', items: unassigned })
    }
    return assigned.filter((g) => g.items.length > 0)
  }, [visible, groupBySpecialist, specialists])

  const showingTasks = filter === 'tasks'

  return (
    <>
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Overview</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {stats.open} open {plural(stats.open, 'consignment')} and {stats.tasks} open {plural(stats.tasks, 'task')} across {specialists.length} specialists
        </p>
      </header>

      {canManage && <NewTaskForm />}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatTile label="Open" value={stats.open} />
        <StatTile label="In progress" value={stats.inProgress} />
        <StatTile label="Awaiting vendor" value={stats.awaiting} />
        <StatTile label="Due within 7 days" value={stats.soon} tone="gold" />
        <StatTile label="Overdue" value={stats.overdue} tone="danger" />
        <StatTile label="Open tasks" value={stats.tasks} tone={stats.tasksOverdue > 0 ? 'danger' : 'neutral'} />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 'var(--space-5)',
        }}
      >
        <Filters value={filter} onChange={setFilter} />
        {!showingTasks && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginLeft: 'auto',
              fontSize: 'var(--size-sm)',
              color: 'var(--text-muted)',
            }}
          >
            <input
              type="checkbox"
              checked={groupBySpecialist}
              onChange={(e) => setGroupBySpecialist(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            Group by specialist
          </label>
        )}
      </div>

      {showingTasks ? (
        <TaskList
          tasks={openTasks}
          specialists={specialists}
          canManage={canManage}
          onReassign={reassignTask}
        />
      ) : (
        <>
          {visible.length === 0 && (
            <p
              style={{
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius)',
                padding: 'var(--space-5)',
                color: 'var(--text-muted)',
              }}
            >
              Nothing matches that filter.
            </p>
          )}

          {groups.map((group) => (
            <section key={group.id} style={{ marginBottom: 'var(--space-6)' }}>
              {group.name && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                  <h2 style={{ fontSize: 'var(--size-lg)' }}>{group.name}</h2>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
                    {group.items.length}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {group.items.map((c) => (
                  <Row
                    key={c.id}
                    consignment={c}
                    history={history}
                    specialists={specialists}
                    canManage={canManage}
                    onReassign={reassign}
                  />
                ))}
              </div>
            </section>
          ))}

          {stats.noLocation > 0 && filter !== 'no_location' && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
              {stats.noLocation} completed {plural(stats.noLocation, 'consignment')} with no storage location recorded.{' '}
              <button
                onClick={() => setFilter('no_location')}
                style={{ color: 'var(--navy)', textDecoration: 'underline', fontWeight: 500 }}
              >
                Show them
              </button>
            </p>
          )}
        </>
      )}
    </>
  )
}

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'awaiting', label: 'Awaiting vendor' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'complete', label: 'Complete' },
]

function Filters({ value, onChange }) {
  return (
    <div role="group" aria-label="Filter consignments" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {FILTERS.map((f) => {
        const active = value === f.id
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            aria-pressed={active}
            style={{
              height: '38px',
              padding: '0 var(--space-4)',
              borderRadius: 'var(--radius)',
              border: `1px solid ${active ? 'var(--navy)' : 'var(--border-strong)'}`,
              background: active ? 'var(--navy)' : 'var(--surface)',
              color: active ? 'var(--text-on-dark)' : 'var(--text)',
              fontWeight: 500,
              fontSize: 'var(--size-sm)',
            }}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

function AssigneePicker({ id, label, value, specialists, canManage, onChange }) {
  const name = specialists.find((s) => s.id === value)?.full_name || 'Unassigned'

  if (!canManage) {
    return (
      <span style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    )
  }

  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: '38px',
          padding: '0 var(--space-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
          maxWidth: '160px',
        }}
      >
        {!value && <option value="">Unassigned</option>}
        {specialists.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>
    </>
  )
}

function TaskList({ tasks, specialists, canManage, onReassign }) {
  if (tasks.length === 0) {
    return (
      <p
        style={{
          background: 'var(--surface-sunken)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-5)',
          color: 'var(--text-muted)',
        }}
      >
        No outstanding tasks.
      </p>
    )
  }

  return (
    <>
      {specialists.map((s) => {
        const items = sortTasks(tasks.filter((t) => t.assigned_to === s.id))
        if (items.length === 0) return null
        return (
          <section key={s.id} style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: 'var(--size-lg)' }}>{s.full_name}</h2>
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>{items.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  footer={
                    canManage ? (
                      <AssigneePicker
                        id={`task-assign-${t.id}`}
                        label={`Reassign ${t.title}`}
                        value={t.assigned_to}
                        specialists={specialists}
                        canManage={canManage}
                        onChange={(to) => onReassign(t.id, to)}
                      />
                    ) : null
                  }
                />
              ))}
            </div>
          </section>
        )
      })}
    </>
  )
}

function Row({ consignment: c, history, specialists, canManage, onReassign }) {
  const status = deriveStatus(c)
  const level = urgency(c)
  const withCurrent = daysWithCurrentSpecialist(c, history)
  const inDept = daysInDept(c)
  const moved = wasReassigned(c, history)
  const action = nextAction(c)

  const accent = {
    overdue: 'var(--danger)',
    soon: 'var(--gold)',
    frozen: 'var(--navy-soft)',
    ok: 'var(--border)',
  }[level]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1fr) auto',
        gap: 'var(--space-4)',
        alignItems: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${accent}`,
        padding: 'var(--space-3) var(--space-4)',
      }}
    >
      <div>
        <p className="receipt">{c.receipt_number}</p>
        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
          {c.vendor_name} · {c.box_count} {plural(c.box_count, 'box')} · in {formatDate(c.arrival_date)}
        </p>
      </div>

      <div>
        <p style={{ fontSize: 'var(--size-sm)' }}>
          {status === STATUS.COMPLETE ? 'Complete' : action}
        </p>
        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
          {status === STATUS.COMPLETE ? STATUS_LABEL[status] : countdownLabel(c)}
        </p>
      </div>

      <div>
        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
          {inDept} {plural(inDept, 'day')} in dept
        </p>
        {moved && (
          <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>
            {withCurrent} {plural(withCurrent, 'day')} with current
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {status === STATUS.COMPLETE && !c.storage_location && <Badge tone="gold">No location</Badge>}
        <AssigneePicker
          id={`assign-${c.id}`}
          label={`Assign ${c.receipt_number} to`}
          value={c.assigned_to}
          specialists={specialists}
          canManage={canManage}
          onChange={(to) => onReassign(c.id, to)}
        />
      </div>
    </div>
  )
}
