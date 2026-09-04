const TONES = {
  neutral: { bg: 'var(--surface-sunken)', fg: 'var(--text-muted)' },
  navy:    { bg: 'var(--navy-tint)',      fg: 'var(--navy)' },
  gold:    { bg: 'var(--gold-tint)',      fg: 'var(--gold)' },
  danger:  { bg: 'var(--danger-tint)',    fg: 'var(--danger)' },
  success: { bg: 'var(--success-tint)',   fg: 'var(--success)' },
}

export default function Badge({ tone = 'neutral', children }) {
  const { bg, fg } = TONES[tone] || TONES.neutral
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        padding: '5px 10px',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--size-sm)',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
