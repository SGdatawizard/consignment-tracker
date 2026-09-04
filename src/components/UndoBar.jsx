import { useEffect } from 'react'
import { useStore } from '../data/store'

export default function UndoBar() {
  const { lastChange, undoLastChange, dismissLastChange } = useStore()

  useEffect(() => {
    if (!lastChange) return
    const timer = setTimeout(dismissLastChange, 12000)
    return () => clearTimeout(timer)
  }, [lastChange, dismissLastChange])

  if (!lastChange) return null

  const destination = lastChange.movedTo === 'awaiting_vendor' ? 'awaiting vendor' : 'complete'

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'var(--space-5)',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        background: 'var(--navy)',
        color: 'var(--text-on-dark)',
        padding: 'var(--space-3) var(--space-3) var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 6px 20px rgba(19, 26, 43, 0.22)',
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 50,
      }}
    >
      <span style={{ fontSize: 'var(--size-sm)' }}>
        <strong className="receipt">{lastChange.receipt}</strong>
        {' moved to '}
        {destination}
      </span>
      <button
        onClick={undoLastChange}
        style={{
          height: '36px',
          padding: '0 var(--space-4)',
          borderRadius: 'var(--radius)',
          background: 'var(--gold)',
          color: '#FFFFFF',
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        Undo
      </button>
    </div>
  )
}
