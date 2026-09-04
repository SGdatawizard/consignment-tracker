export function Loading() {
  return (
    <p style={{ color: 'var(--text-muted)', padding: 'var(--space-6) 0' }}>
      Loading…
    </p>
  )
}

export function ErrorBar({ message, onDismiss }) {
  if (!message) return null
  return (
    <div
      role="alert"
      style={{
        background: 'var(--danger-tint)',
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-3) var(--space-4)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-4)',
        alignItems: 'center',
        fontSize: 'var(--size-sm)',
      }}
    >
      <span>Something went wrong: {message}</span>
      <button onClick={onDismiss} style={{ color: 'var(--danger)', fontWeight: 500 }}>
        Dismiss
      </button>
    </div>
  )
}
