function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function hoursAgo(n) {
  return new Date(Date.now() - n * 3600 * 1000).toISOString()
}

export const SEED_TASKS = [
  {
    id: 't1',
    title: 'S26010 unsolds',
    detail: 'Contact vendors about the unsold lots and confirm whether they want them re-offered or returned.',
    assigned_to: 'u3',
    created_by: 'u1',
    created_at: hoursAgo(70),
    due_date: daysFromNow(1),
    completed: false,
    completed_at: null,
  },
  {
    id: 't2',
    title: 'Condition reports for the January sale',
    detail: '',
    assigned_to: 'u3',
    created_by: 'u1',
    created_at: hoursAgo(200),
    due_date: daysFromNow(12),
    completed: false,
    completed_at: null,
  },
  {
    id: 't3',
    title: 'Chase valuations paperwork from Hartley',
    detail: '',
    assigned_to: 'u4',
    created_by: 'u1',
    created_at: hoursAgo(400),
    due_date: daysFromNow(-3),
    completed: false,
    completed_at: null,
  },
  {
    id: 't4',
    title: 'Tidy the silver store',
    detail: '',
    assigned_to: 'u4',
    created_by: 'u1',
    created_at: hoursAgo(90),
    due_date: null,
    completed: false,
    completed_at: null,
  },
  {
    id: 't5',
    title: 'S25099 catalogue proof',
    detail: '',
    assigned_to: 'u5',
    created_by: 'u1',
    created_at: hoursAgo(500),
    due_date: daysFromNow(-1),
    completed: true,
    completed_at: hoursAgo(30),
  },
]
