import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import UndoBar from './UndoBar'

export default function Layout() {
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
        <Outlet />
      </main>
      <UndoBar />
    </div>
  )
}
