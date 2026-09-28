import { differenceInCalendarDays, parseISO } from 'date-fns'

export function daysHeld(item) {
  return differenceInCalendarDays(new Date(), new Date(item.created_at))
}

export function collectionStatus(item) {
  if (item.collected) return 'collected'
  if (!item.expected_collection_date) return 'none'
  const days = differenceInCalendarDays(parseISO(item.expected_collection_date), new Date())
  if (days < 0) return 'overdue'
  if (days <= 2) return 'soon'
  return 'ok'
}

export function collectionLabel(item) {
  if (!item.expected_collection_date) return null
  const days = differenceInCalendarDays(parseISO(item.expected_collection_date), new Date())
  if (days < 0) return `Expected ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
  if (days === 0) return 'Expected today'
  if (days === 1) return 'Expected tomorrow'
  return `Expected in ${days} days`
}

export function matchesSearch(item, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [item.item_description, item.held_for, item.storage_location]
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(q))
}

export function sortHeld(list) {
  return [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}
