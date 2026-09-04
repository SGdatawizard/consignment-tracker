export default function Field({ id, label, hint, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <label htmlFor={id} style={{ fontWeight: 500 }}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginTop: '-4px' }}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} style={{ fontSize: 'var(--size-sm)', color: 'var(--danger)', fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  )
}

export const inputStyle = {
  width: '100%',
  height: 'var(--control-height-lg)',
  padding: '0 var(--space-4)',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border-strong)',
  background: 'var(--surface)',
}
