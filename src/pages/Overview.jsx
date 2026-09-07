import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { useAuth, CAN } from '../data/auth'
import StatTile from '../components/StatTile'
import Badge from '../components/Badge'
import TaskCard from '../components/TaskCard'
import NewTaskForm from '../components/NewTaskForm'
import SplitPanel from '../components/SplitPanel'
import {
  deriveStatus, STATUS, STATUS_LABEL, urgency, countdownLabel,
  daysInDept, wasReassigned, sortByUrgency, formatDate, plural,
} from '../lib/consignments'
import { partsFor, nextActionShared, valuationProgress } from '../lib/assignments'
import { sortTasks, taskUrgency } from '../lib/tasks'

export default function Overview() {
  const { consignments, assignments, tasks, history, people, specialists, reassignTask } = useStore()
  const { profile } = useAuth()
  const canManage = CAN.manage(profile.role)

  const [filter, setFilter] = useState('open')
  const [groupBySpecialist, setGroupBySpecialist] = useState(true)
  const [expanded, setExpanded] = useState(null)

  const open = consignments.filter((c) => deriveStatus(c) !== STATUS.COMPLETE)
  const openTasks = tasks.filter((t) => !t.completed)

  const stats = useMemo(() => ({
    open: open.length,
    inProgress: open.filter((c) => deriveStatus(c) === STATUS.IN_PROGRESS).length,
    awaiting: open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR).length,
    overdue: open.filter((c) => urgency(c) === 'overdue').length,
    soon: open.filter((c) => urgency(c) === 'soon').length,
    shared: open.filter((c) => partsFor(c.id, assignments).length > 1).length,
    tasks: openTasks.length,
    tasksOverdue: openTasks.filter((t) => taskUrgency(t) === 'overdue').length,
    noLocation: consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE && !c.storage_location).length,
  }), [consignments, open, openTasks, assignments])

  const visible = useMemo(() => {
    let list = consignments
    if (filter === 'open') list = open
    if (filter === 'overdue') list = open.filter((c) => urgency(c) === 'overdue')
    if (filter === 'awaiting') list = open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR)
    if (filter === 'shared') list = open.filter((c) => partsFor(c.id, assignments).length > 1)
    if (filter === 'complete') list = consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE)
    if (filter === 'no_location') list = consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE && !c.storage_location)
    if (filter === 'tasks') list = []
    return sortByUrgency(list)
  }, [consignments, open, filter, assignments])

  const groups = useMemo(() => {
    if (!groupBySpecialist) return [{ id: 'all', name: null, items: visible }]

    const byPerson = specialists.map((s) => ({
      id: s.id,
      name: s.full_name,
      items: visible.filter((c) =>
        assignments.some((a) => a.consignment_id === c.id && a.specialist_id === s.id)
      ),
    }))

    const unassigned = visible.filter((c) => partsFor(c.id, assignments).length === 0)
    if (unassigned.length) byPerson.push({ id: 'none', name: 'Unassigned', items: unassigned })

    return byPerson.filter((g) => g.items.length > 0)
  }, [visible, groupBySpecialist, specialists, assignments])

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
                    key={`${group.id}-${c.id}`}
                    consignment={c}
                    assignments={assignments}
                    people={people}
                    history={history}
                    canManage={canManage}
                    expanded={expanded === `${group.id}-${c.id}`}
                    onToggleExpand={() =>
                      setExpanded((prev) => (prev === `${group.id}-${c.id}` ? null : `${group.id}-${c.id}`))
                    }
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
  { id: 'shared', label: 'Shared' },
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
                      <TaskAssignee task={t} specialists={specialists} onReassign={onReassign} />
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

function TaskAssignee({ task, specialists, onReassign }) {
  return (
    <>
      <label htmlFor={`task-assign-${task.id}`} className="sr-only">
        Reassign {task.title}
      </label>
      <select
        id={`task-assign-${task.id}`}
        value={task.assigned_to}
        onChange={(e) => onReassign(task.id, e.target.value)}
        style={{
          height: '38px',
          padding: '0 var(--space-2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
