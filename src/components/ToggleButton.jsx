export default function ToggleButton({ checked, onChange, label, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        minHeight: 'var(--control-height)',
        padding: '0 var(--space-4)',
        borderRadius: 'var(--radius)',
        border: `1px solid ${checked ? 'var(--success)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--success-tint)' : 'var(--surface)',
        color: checked ? 'var(--success)' : 'var(--text)',
        fontWeight: 500,
        textAlign: 'left',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 120ms ease, border-color 120ms ease',
      }}
    >
      <Box checked={checked} />
      <span>{label}</span>
    </button>
  )
}

function Box({ checked }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flexShrink: 0,
        width: '22px',
        height: '22px',
        borderRadius: '5px',
        border: `2px solid ${checked ? 'var(--success)' : 'var(--border-strong)'}`,
        background: checked ? 'var(--success)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="#FFFFFF" strokeWidth="3.5"
             strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </span>
  )
}
