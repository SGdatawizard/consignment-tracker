import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { useAuth, CAN } from '../data/auth'
import StatTile from '../components/StatTile'
import Badge from '../components/Badge'
import TaskCard from '../components/TaskCard'
import NewTaskForm from '../components/NewTaskForm'
import SplitPanel from '../components/SplitPanel'
import LocationField from '../components/LocationField'
import NotesField from '../components/NotesField'
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
    currentUserId, reassignTask, setStorageLocation, setNeedsChasing,
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
