import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, CAN } from './data/auth'
import { StoreProvider } from './data/store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Auctions from './pages/Auctions'
import MyWork from './pages/MyWork'

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { session, profile, loading } = useAuth()

  if (loading) return <Splash>Loading…</Splash>
  if (!session) return <Login />
  if (!profile) return <Splash>No profile found for this account. Ask the office to check your setup.</Splash>

  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route
            path="/auctions"
            element={<Guard allowed={CAN.bookIn(profile.role)}><Auctions /></Guard>}
          />
          <Route
            path="/my-work"
            element={<Guard allowed={CAN.ownWork(profile.role)}><MyWork /></Guard>}
          />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}

function Guard({ allowed, children }) {
  if (!allowed) return <Navigate to="/overview" replace />
  return children
}

function Splash({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-6)' }}>
      <p style={{ color: 'var(--text-muted)' }}>{children}</p>
    </div>
  )
}
