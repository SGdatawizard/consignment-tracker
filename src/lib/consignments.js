import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

export const WINDOW_DAYS = 30
export const SOON_THRESHOLD = 7

export const STATUS = {
  IN_PROGRESS: 'in_progress',
  AWAITING_VENDOR: 'awaiting_vendor',
  COMPLETE: 'complete',
}

export const STATUS_LABEL = {
  in_progress: 'In progress',
  awaiting_vendor: 'Awaiting vendor',
  complete: 'Complete',
}

export function deriveStatus(c) {
  if (c.described || c.sent_back_to_vendor) return STATUS.COMPLETE
  if (c.valued && c.vendor_emailed) return STATUS.AWAITING_VENDOR
  return STATUS.IN_PROGRESS
}

export function completionReason(c) {
  if (c.described) return 'described'
  if (c.sent_back_to_vendor) return 'sent_back'
  return null
}

export function deadline(c) {
  return addDays(parseISO(c.arrival_date), WINDOW_DAYS)
}

function clockStoppedAt(c) {
  if (c.awaiting_vendor_at) return new Date(c.awaiting_vendor_at)
  if (c.completed_at) return new Date(c.completed_at)
  return null
}

export function daysRemaining(c) {
  const stopped = clockStoppedAt(c)
  return differenceInCalendarDays(deadline(c), stopped || new Date())
}

export function isClockFrozen(c) {
  return clockStoppedAt(c) !== null
}

export function urgency(c) {
  if (isClockFrozen(c)) return 'frozen'
  const days = daysRemaining(c)
  if (days < 0) return 'overdue'
  if (days <= SOON_THRESHOLD) return 'soon'
  return 'ok'
}

export function countdownLabel(c) {
  const days = daysRemaining(c)
  if (isClockFrozen(c)) return 'Clock paused'
  if (days < 0) return `${Math.abs(days)} ${plural(Math.abs(days), 'day')} overdue`
  if (days === 0) return 'Due today'
  return `${days} ${plural(days, 'day')} left`
}

export function daysInDept(c) {
  return differenceInCalendarDays(new Date(), parseISO(c.arrival_date))
}

export function daysWithCurrentSpecialist(c, history) {
  const moves = history
    .filter((h) => h.consignment_id === c.id && h.to_user === c.assigned_to)
    .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
  const since = moves.length ? new Date(moves[0].changed_at) : parseISO(c.arrival_date)
  return differenceInCalendarDays(new Date(), since)
}

export function wasReassigned(c, history) {
  return history.some((h) => h.consignment_id === c.id)
}

export function nextAction(c) {
  const status = deriveStatus(c)
  if (status === STATUS.COMPLETE) return null
  if (status === STATUS.AWAITING_VENDOR) return 'Waiting on the vendor'
  if (!c.valued && !c.vendor_emailed) return 'Needs valuing'
  if (!c.valued) return 'Needs valuing'
  return 'Needs vendor emailing'
}

export function formatDate(iso) {
  return format(typeof iso === 'string' ? parseISO(iso) : iso, 'd MMM')
}

export function formatDateLong(iso) {
  return format(typeof iso === 'string' ? parseISO(iso) : iso, 'd MMMM yyyy')
}

export function plural(n, word) {
  return n === 1 ? word : `${word}s`
}

export function sortByUrgency(list) {
  return [...list].sort((a, b) => daysRemaining(a) - daysRemaining(b))
}
