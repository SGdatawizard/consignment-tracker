import { Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from './data/store'
import Layout from './components/Layout'
import MyWork from './pages/MyWork'
import Overview from './pages/Overview'
import Auctions from './pages/Auctions'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/my-work" element={<MyWork />} />
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
