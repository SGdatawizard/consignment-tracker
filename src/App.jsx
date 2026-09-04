import { Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from './data/store'
import Layout from './components/Layout'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Placeholder title="Overview" />} />
          <Route path="/auctions" element={<Placeholder title="Book in" />} />
          <Route path="/my-work" element={<Placeholder title="My work" />} />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}

function Placeholder({ title }) {
  return (
    <>
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
        Coming in the next step.
      </p>
    </>
  )
}
