import Badge from './Badge'
import Countdown from './Countdown'
import ToggleButton from './ToggleButton'
import { deriveStatus, formatDate, STATUS, plural } from '../lib/consignments'

export default function ConsignmentCard({ consignment: c, onToggle, footer }) {
  const status = deriveStatus(c)
  const isComplete = status === STATUS.COMPLETE
  const isAwaiting = status === STATUS.AWAITING_VENDOR

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--space-5)',
        opacity: isComplete ? 0.82 : 1,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="receipt" style={{ fontSize: 'var(--size-lg)' }}>
            {c.receipt_number}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: '2px' }}>
            {c.vendor_name} · {c.box_count} {plural(c.box_count, 'box')} · arrived {formatDate(c.arrival_date)}
          </p>
        </div>
        {isComplete ? <Badge tone="success">Complete</Badge> : <Countdown consignment={c} />}
      </header>

      {c.storage_location && (
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: 'var(--space-2)' }}>
          Stored at {c.storage_location}
        </p>
      )}

      {!isComplete && onToggle && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-4)',
          }}
        >
          {isAwaiting ? (
            <>
              <ToggleButton
                label="Described"
                checked={c.described}
                onChange={(v) => onToggle(c.id, 'described', v)}
              />
              <ToggleButton
                label="Sent back to vendor"
                checked={c.sent_back_to_vendor}
                onChange={(v) => onToggle(c.id, 'sent_back_to_vendor', v)}
              />
            </>
          ) : (
            <>
              <ToggleButton
                label="Valued"
                checked={c.valued}
                onChange={(v) => onToggle(c.id, 'valued', v)}
              />
              <ToggleButton
                label="Vendor emailed"
                checked={c.vendor_emailed}
                onChange={(v) => onToggle(c.id, 'vendor_emailed', v)}
              />
            </>
          )}
        </div>
      )}

      {footer && (
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          {footer}
        </div>
      )}
    </article>
  )
}
