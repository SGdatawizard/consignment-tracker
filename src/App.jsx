export default function App() {
  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '640px' }}>
      <h1>Consignment tracker</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
        Style check — this page gets replaced in step 6.
      </p>

      <p className="receipt" style={{ fontSize: 'var(--size-xl)', marginTop: 'var(--space-5)' }}>
        R2000348
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
        <Chip bg="var(--danger-tint)" fg="var(--danger)" label="2 days left" />
        <Chip bg="var(--gold-tint)" fg="var(--gold)" label="6 days left" />
        <Chip bg="var(--success-tint)" fg="var(--success)" label="Valued" />
        <Chip bg="var(--navy-tint)" fg="var(--navy)" label="Awaiting vendor" />
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--space-5)',
        marginTop: 'var(--space-5)',
      }}>
        <h3>Card surface</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          Slightly lighter than the page behind it.
        </p>
        <button style={{
          background: 'var(--navy)',
          color: 'var(--text-on-dark)',
          height: 'var(--control-height)',
          padding: '0 var(--space-5)',
          borderRadius: 'var(--radius)',
          fontWeight: 500,
          marginTop: 'var(--space-4)',
        }}>
          Primary button
        </button>
      </div>
    </div>
  )
}

function Chip({ bg, fg, label }) {
  return (
    <span style={{
      background: bg,
      color: fg,
      padding: '6px 12px',
      borderRadius: 'var(--radius-sm)',
      fontSize: 'var(--size-sm)',
      fontWeight: 500,
    }}>
      {label}
    </span>
  )
}
