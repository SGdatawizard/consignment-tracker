import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { useAuth, CAN } from '../data/auth'
import StatTile from '../components/StatTile'
import Badge from '../components/Badge'
import TaskCard from '../components/TaskCard'
import NewTaskForm from '../components/NewTaskForm'
import SplitPanel from '../components/SplitPanel'
import LocationField from '../components/LocationField'
import {
  deriveStatus, STATUS, STATUS_LABEL, urgency, countdownLabel, daysRemaining,
  daysInDept, wasReassigned, formatDate, plural,
} from '../lib/consignments'
import { partsFor, nextActionShared, valuationProgress } from '../lib/assignments'
import { sortTasks, taskUrgency } from '../lib/tasks'
import { chaserLabel } from '../lib/chase'

const SORTS = [
  { id: 'urgent', label: 'Most urgent first' },
  { id: 'least_urgent', label: 'Least urgent first' },
  { id: 'oldest', label: 'Longest in dept' },
  { id: 'newest', label: 'Most recently arrived' },
  { id: 'receipt', label: 'Receipt number' },
  { id: 'vendor', label: 'Vendor name' },
]

function applySort(list, sort) {
  const out = [...list]
  if (sort === 'urgent') return out.sort((a, b) => daysRemaining(a) - daysRemaining(b))
  if (sort === 'least_urgent') return out.sort((a, b) => daysRemaining(b) - daysRemaining(a))
  if (sort === 'oldest') return out.sort((a, b) => new Date(a.arrival_date) - new Date(b.arrival_date))
  if (sort === 'newest') return out.sort((a, b) => new Date(b.arrival_date) - new Date(a.arrival_date))
  if (sort === 'receipt') return out.sort((a, b) => a.receipt_number.localeCompare(b.receipt_number))
  if (sort === 'vendor') return out.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name))
  return out
}

export default function Overview() {
  const {
    consignments, assignments, tasks, history, people, specialists, chaser,
    reassignTask, setStorageLocation, setNeedsChasing,
  } = useStore()
  const { profile } = useAuth()
  const canManage = CAN.manage(profile.role)

  const [filter, setFilter] = useState('open')
  const [sort, setSort] = useState('urgent')
  const [groupBySpecialist, setGroupBySpecialist] = useState(true)
  const [expandedRow, setExpandedRow] = useState(null)
  const [collapsed, setCollapsed] = useState([])

  const open = consignments.filter((c) => deriveStatus(c) !== STATUS.COMPLETE)
  const openTasks = tasks.filter((t) => !t.completed)

  const stats = useMemo(() => ({
    open: open.length,
    inProgress: open.filter((c) => deriveStatus(c) === STATUS.IN_PROGRESS).length,
    awaiting: open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR).length,
    overdue: open.filter((c) => urgency(c) === 'overdue').length,
    soon: open.filter((c) => urgency(c) === 'soon').length,
    chasing: open.filter((c) => c.needs_chasing).length,
    tasks: openTasks.length,
    tasksOverdue: openTasks.filter((t) => taskUrgency(t) === 'overdue').length,
    noLocation: consignments.filter((c) => !c.storage_location).length,
  }), [consignments, open, openTasks])

  const visible = useMemo(() => {
    let list = consignments
    if (filter === 'open') list = open
    if (filter === 'overdue') list = open.filter((c) => urgency(c) === 'overdue')
    if (filter === 'awaiting') list = open.filter((c) => deriveStatus(c) === STATUS.AWAITING_VENDOR)
    if (filter === 'chasing') list = open.filter((c) => c.needs_chasing)
    if (filter === 'shared') list = open.filter((c) => partsFor(c.id, assignments).length > 1)
    if (filter === 'complete') list = consignments.filter((c) => deriveStatus(c) === STATUS.COMPLETE)
    if (filter === 'no_location') list = consignments.filter((c) => !c.storage_location)
    if (filter === 'tasks') list = []
    return applySort(list, sort)
  }, [consignments, open, filter, assignments, sort])

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

  function toggleGroup(id) {
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const groupIds = showingTasks ? specialists.map((s) => s.id) : groups.map((g) => g.id)
  const allCollapsed = groupIds.length > 0 && groupIds.every((id) => collapsed.includes(id))

  return (
    <>
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Overview</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {stats.open} open {plural(stats.open, 'consignment')} and {stats.tasks} open {plural(stats.tasks, 'task')} across {specialists.length} people
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
        <StatTile label="To chase" value={stats.chasing} tone={stats.chasing > 0 ? 'gold' : 'neutral'} />
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

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {!showingTasks && (
            <>
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  height: '38px',
                  padding: '0 var(--space-3)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-strong)',
                  background: 'var(--surface)',
                  fontSize: 'var(--size-sm)',
                }}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </>
          )}

          {(showingTasks || groupBySpecialist) && groupIds.length > 1 && (
            <button
              onClick={() => { setCollapsed(allCollapsed ? [] : groupIds); setExpandedRow(null) }}
              style={{
                height: '38px',
                padding: '0 var(--space-3)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-strong)',
                background: 'var(--surface)',
                fontSize: 'var(--size-sm)',
                fontWeight: 500,
              }}
            >
              {allCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          )}

          {!showingTasks && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
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
      </div>

      {showingTasks ? (
        <TaskList
          tasks={openTasks}
          specialists={specialists}
          canManage={canManage}
          collapsed={collapsed}
          onToggleGroup={toggleGroup}
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

          {groups.map((group) => {
            const isCollapsed = collapsed.includes(group.id)
            return (
              <section key={group.id} style={{ marginBottom: 'var(--space-5)' }}>
                {group.name && (
                  <GroupHeader
                    name={group.name}
                    count={group.items.length}
                    summary={consignmentSummary(group.items)}
                    collapsed={isCollapsed}
                    onToggle={() => toggleGroup(group.id)}
                  />
                )}

                {!isCollapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {group.items.map((c) => (
                      <Row
                        key={`${group.id}-${c.id}`}
                        consignment={c}
                        assignments={assignments}
                        people={people}
                        history={history}
                        chaser={chaser}
                        canManage={canManage}
                        expanded={expandedRow === `${group.id}-${c.id}`}
                        onToggleExpand={() =>
                          setExpandedRow((prev) => (prev === `${group.id}-${c.id}` ? null : `${group.id}-${c.id}`))
                        }
                        onSaveLocation={setStorageLocation}
                        onSetNeedsChasing={setNeedsChasing}
                      />
                    ))}
                  </div>
                )}
              </section>
            )
          })}

          {stats.noLocation > 0 && filter !== 'no_location' && (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
              {stats.noLocation} {plural(stats.noLocation, 'consignment')} with no storage location recorded.{' '}
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

function consignmentSummary(items) {
  const overdue = items.filter((c) => urgency(c) === 'overdue').length
  const soon = items.filter((c) => urgency(c) === 'soon').length
  const chasing = items.filter((c) => c.needs_chasing).length
  const bits = []
  if (overdue) bits.push({ text: `${overdue} overdue`, tone: 'danger' })
  if (soon) bits.push({ text: `${soon} due soon`, tone: 'gold' })
  if (chasing) bits.push({ text: `${chasing} chasing`, tone: 'gold' })
  return bits
}

function taskSummary(items) {
  const overdue = items.filter((t) => taskUrgency(t) === 'overdue').length
  const soon = items.filter((t) => taskUrgency(t) === 'soon').length
  const bits = []
  if (overdue) bits.push({ text: `${overdue} overdue`, tone: 'danger' })
  if (soon) bits.push({ text: `${soon} due soon`, tone: 'gold' })
  return bits
}

function GroupHeader({ name, count, summary, collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        minHeight: 'var(--control-height)',
        padding: 'var(--space-2) var(--space-3)',
        marginBottom: collapsed ? 0 : 'var(--space-3)',
        borderRadius: 'var(--radius)',
        background: collapsed ? 'var(--surface-sunken)' : 'transparent',
        textAlign: 'left',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '14px',
          color: 'var(--text-muted)',
          transform: collapsed ? 'rotate(-90deg)' : 'none',
          transition: 'transform 120ms ease',
          fontSize: 'var(--size-xs)',
        }}
      >
        ▼
      </span>

      <span style={{ fontSize: 'var(--size-lg)', fontWeight: 700 }}>{name}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>{count}</span>

      <span style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto', flexWrap: 'wrap' }}>
        {summary.map((bit) => (
          <Badge key={bit.text} tone={bit.tone}>{bit.text}</Badge>
        ))}
      </span>
    </button>
  )
}

const FILTERS = [
  { id: 'open', label: 'Open' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'awaiting', label: 'Awaiting vendor' },
  { id: 'chasing', label: 'To chase' },
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

function TaskList({ tasks, specialists, canManage, collapsed, onToggleGroup, onReassign }) {
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
        const isCollapsed = collapsed.includes(s.id)

        return (
          <section key={s.id} style={{ marginBottom: 'var(--space-5)' }}>
            <GroupHeader
              name={s.full_name}
              count={items.length}
              summary={taskSummary(items)}
              collapsed={isCollapsed}
              onToggle={() => onToggleGroup(s.id)}
            />

            {!isCollapsed && (
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
            )}
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
          maxWidth: '180px',
        }}
      >
        {specialists.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </select>
    </>
  )
}

function Row({
  consignment: c, assignments, people, history, chaser, canManage,
  expanded, onToggleExpand, onSaveLocation, onSetNeedsChasing,
}) {
  const status = deriveStatus(c)
  const level = urgency(c)
  const inDept = daysInDept(c)
  const moved = wasReassigned(c, history)
  const parts = partsFor(c.id, assignments)
  const progress = valuationProgress(c.id, assignments)
  const action = nextActionShared(c, assignments, people)
  const isAwaiting = status === STATUS.AWAITING_VENDOR

  const names = parts
    .map((p) => people.find((u) => u.id === p.specialist_id)?.full_name)
    .filter(Boolean)

  const accent = {
    overdue: 'var(--danger)',
    soon: 'var(--gold)',
    frozen: 'var(--navy-soft)',
    ok: 'var(--border)',
  }[level]

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1fr) auto',
          gap: 'var(--space-4)',
          alignItems: 'center',
          padding: 'var(--space-3) var(--space-4)',
        }}
      >
        <div>
          <p className="receipt">
            {c.receipt_number}
            {parts.length > 1 && (
              <span style={{ marginLeft: 'var(--space-2)' }}>
                <Badge tone="navy">Split {progress.done}/{progress.total}</Badge>
              </span>
            )}
            {c.needs_chasing && (
              <span style={{ marginLeft: 'var(--space-2)' }}>
                <Badge tone="gold">Chasing</Badge>
              </span>
            )}
          </p>
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
          <p style={{ fontSize: 'var(--size-xs)', color: c.storage_location ? 'var(--text-muted)' : 'var(--gold)' }}>
            {c.storage_location || 'No location'}
          </p>
          {moved && (
            <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)' }}>Reassigned</p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {!canManage && (
            <span style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
              {names.join(', ') || 'Unassigned'}
            </span>
          )}
          <button
            onClick={onToggleExpand}
            aria-expanded={expanded}
            style={{
              height: '38px',
              padding: '0 var(--space-3)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-strong)',
              fontSize: 'var(--size-sm)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? 'Close' : canManage ? (names.length > 1 ? `${names.length} people` : names[0]?.split(' ')[0] || 'Assign') : 'Details'}
          </button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: 'var(--space-4)',
            background: 'var(--page)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <div style={{ maxWidth: '340px' }}>
            <LocationField consignment={c} onSave={onSaveLocation} />
          </div>

          {isAwaiting && chaser && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--size-sm)',
                fontWeight: 500,
              }}
            >
              <input
                type="checkbox"
                checked={c.needs_chasing}
                onChange={(e) => onSetNeedsChasing(c.id, e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              {chaserLabel(chaser)}
            </label>
          )}

          {canManage && <SplitPanel consignment={c} />}
        </div>
      )}
    </div>
  )
}
