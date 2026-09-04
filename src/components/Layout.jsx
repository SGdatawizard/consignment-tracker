import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import UndoBar from './UndoBar'
import { useStore } from '../data/store'
import { Loading, ErrorBar } from './Loading'

export default function Layout() {
  const { loading, error, dismissError } = useStore()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 240px) minmax(0, 1fr)',
        minHeight: '100vh',
      }}
    >
      <Sidebar />
      <main style={{ padding: 'var(--space-6)', maxWidth: '1100px', width: '100%' }}>
        <ErrorBar message={error} onDismiss={dismissError} />
        {loading ? <Loading /> : <Outlet />}
      </main>
      <UndoBar />
    </div>
  )
}
