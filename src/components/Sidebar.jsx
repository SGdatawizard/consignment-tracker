import { NavLink } from 'react-router-dom'
import { useStore } from '../data/store'

const NAV = [
  { to: '/overview', label: 'Overview', roles: ['head_of_dept', 'auctions', 'admin'] },
  { to: '/auctions', label: 'Book in', roles: ['auctions', 'head_of_dept', 'admin'] },
  { to: '/my-work', label: 'My work', roles: ['specialist', 'head_of_dept', 'admin'] },
]

export default function Sidebar() {
  const { currentUser, users, setCurrentUserId } = useStore()
  const items = NAV.filter((item) => item.roles.includes(currentUser.role))

  return (
    <nav
      aria-label="Main"
      style={{
        background: 'var(--navy)',
        color: 'var(--text-on-dark)',
        padding: 'var(--space-5) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <div>
        <p style={{ fontWeight: 700, fontSize: 'var(--size-lg)', lineHeight: 1.2 }}>Consignments</p>
        <p style={{ color: 'var(--text-on-dark-muted)', fontSize: 'var(--size-sm)' }}>Tracking</p>
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} style={navLinkStyle}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 'auto' }}>
        <label
          htmlFor="user-switch"
          style={{ display: 'block', fontSize: 'var(--size-xs)', color: 'var(--text-on-dark-muted)', marginBottom: 'var(--space-2)' }}
        >
          Demo: view as
        </label>
        <select
          id="user-switch"
          value={currentUser.id}
          onChange={(e) => setCurrentUserId(e.target.value)}
          style={{
            width: '100%',
            height: 'var(--control-height)',
            padding: '0 var(--space-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--navy-soft)',
            background: 'var(--navy-soft)',
            color: 'var(--text-on-dark)',
          }}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id} style={{ color: '#131A2B' }}>
              {u.full_name}
            </option>
          ))}
        </select>
      </div>
    </nav>
  )
}

function navLinkStyle({ isActive }) {
  return {
    display: 'flex',
    alignItems: 'center',
    minHeight: 'var(--control-height)',
    padding: '0 var(--space-4)',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    fontWeight: 500,
    background: isActive ? 'var(--gold)' : 'transparent',
    color: isActive ? '#FFFFFF' : 'var(--text-on-dark-muted)',
  }
}
