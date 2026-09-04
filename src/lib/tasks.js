import { differenceInCalendarDays, parseISO } from 'date-fns'
import { plural } from './consignments'

export const TASK_SOON_THRESHOLD = 2

export function taskDaysRemaining(t) {
  if (!t.due_date) return null
  return differenceInCalendarDays(parseISO(t.due_date), new Date())
}

export function taskUrgency(t) {
  if (t.completed) return 'done'
  const days = taskDaysRemaining(t)
  if (days === null) return 'none'
  if (days < 0) return 'overdue'
  if (days <= TASK_SOON_THRESHOLD) return 'soon'
  return 'ok'
}

export function taskDueLabel(t) {
  const days = taskDaysRemaining(t)
  if (days === null) return 'No due date'
  if (days < 0) return `${Math.abs(days)} ${plural(Math.abs(days), 'day')} overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

export function sortTasks(list) {
  return [...list].sort((a, b) => {
    const da = taskDaysRemaining(a)
    const db = taskDaysRemaining(b)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })
}
