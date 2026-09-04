export const USERS = [
  { id: 'u1', full_name: 'Margaret Ashby',   role: 'head_of_dept', email: 'm.ashby@example.com' },
  { id: 'u2', full_name: 'Tom Reddin',       role: 'auctions',     email: 't.reddin@example.com' },
  { id: 'u3', full_name: 'Sarah Whitfield',  role: 'specialist',   email: 's.whitfield@example.com' },
  { id: 'u4', full_name: 'James Okafor',     role: 'specialist',   email: 'j.okafor@example.com' },
  { id: 'u5', full_name: 'Priya Raman',      role: 'specialist',   email: 'p.raman@example.com' },
]

export const SPECIALISTS = USERS.filter((u) => u.role === 'specialist')

export function getUser(id) {
  return USERS.find((u) => u.id === id) || null
}

export function userName(id) {
  return getUser(id)?.full_name || 'Unassigned'
}
