export default function LocationField({ consignment: c, onSave, compact = false }) {
  return (
    <div style={{ flex: compact ? '1 1 220px' : undefined }}>
      <label
        htmlFor={`loc-${c.id}`}
        style={{
          display: 'block',
          fontSize: 'var(--size-sm)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Storage location
      </label>
      <input
        id={`loc-${c.id}`}
        defaultValue={c.storage_location || ''}
        placeholder="Add Location"
        onBlur={(e) => {
          const next = e.target.value.trim()
          if (next !== (c.storage_location || '')) onSave(c.id, next)
        }}
        style={{
          width: '100%',
          height: 'var(--control-height)',
          padding: '0 var(--space-3)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-strong)',
          background: 'var(--surface)',
        }}
      />
    </div>
  )
}
