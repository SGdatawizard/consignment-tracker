export default function StatTile({ label, value, tone = 'neutral' }) {
  const colour = {
    neutral: 'var(--text)',
    danger: 'var(--danger)',
    gold: 'var(--gold)',
    success: 'var(--success)',
  }[tone]

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 'var(--space-4)',
      }}
    >
      <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>{label}</p>
      <p style={{ fontSize: 'var(--size-2xl)', fontWeight: 700, color: colour, lineHeight: 1.2 }}>
        {value}
      </p>
    </div>
  )
}
