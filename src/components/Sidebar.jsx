import { NavLink } from 'react-router-dom'
import { useAuth, CAN } from '../data/auth'

export default function Sidebar() {
  const { profile, signOut } = useAuth()

  const items = [
    { to: '/overview', label: 'Overview', show: true },
    { to: '/auctions', label: 'Book in', show: CAN.bookIn(profile.role) },
    { to: '/my-work', label: 'My work', show: CAN.ownWork(profile.role) },
  ].filter((i) => i.show)

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
        <p style={{ fontSize: 'var(--size-sm)', fontWeight: 500 }}>{profile.full_name}</p>
        <p style={{ fontSize: 'var(--size-xs)', color: 'var(--text-on-dark-muted)', marginBottom: 'var(--space-3)' }}>
          {ROLE_LABEL[profile.role]}
        </p>
        <button
          onClick={signOut}
          style={{
            width: '100%',
            height: 'var(--control-height)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--navy-soft)',
            color: 'var(--text-on-dark-muted)',
            fontWeight: 500,
          }}
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}

const ROLE_LABEL = {
  head_of_dept: 'Head of department',
  auctions: 'Auctions',
  specialist: 'Specialist',
  admin: 'Administrator',
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
