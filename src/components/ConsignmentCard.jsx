import Badge from './Badge'
import Countdown from './Countdown'
import ToggleButton from './ToggleButton'
import NotesField from './NotesField'
import { deriveStatus, formatDate, STATUS, plural } from '../lib/consignments'
import { partsFor, myPart, valuationProgress, outstandingValuers } from '../lib/assignments'
import { chaserLabel } from '../lib/chase'

export default function ConsignmentCard({
  consignment: c,
  assignments,
  people,
  currentUserId,
  chaser,
  onSetMyValued,
  onSetSharedFlag,
  onSetNeedsChasing,
  footer,
}) {
  const status = deriveStatus(c)
  const isComplete = status === STATUS.COMPLETE
  const isAwaiting = status === STATUS.AWAITING_VENDOR

  const parts = partsFor(c.id, assignments)
  const mine = myPart(c.id, assignments, currentUserId)
  const shared = parts.length > 1
  const progress = valuationProgress(c.id, assignments)
  const waiting = outstandingValuers(c.id, assignments, people)

  const others = parts
    .filter((p) => p.specialist_id !== currentUserId)
    .map((p) => ({
      ...p,
      name: people.find((u) => u.id === p.specialist_id)?.full_name || 'Unknown',
    }))

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
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {c.needs_chasing && <Badge tone="gold">Chasing</Badge>}
          {isComplete ? <Badge tone="success">Complete</Badge> : <Countdown consignment={c} />}
        </div>
      </header>

      {mine?.remit && (
        <p
          style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--gold-tint)',
            borderRadius: 'var(--radius)',
            fontSize: 'var(--size-sm)',
            fontWeight: 500,
          }}
        >
          Your part: {mine.remit}
        </p>
      )}

      {shared && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            Shared with {others.length} {others.length === 1 ? 'other' : 'others'} · {progress.done} of {progress.total} valued
          </p>
          {others.map((o) => (
            <p key={o.id} style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)' }}>
              <span style={{ color: o.valued ? 'var(--success)' : 'var(--text-muted)', fontWeight: 500 }}>
                {o.valued ? '✓' : '○'} {o.name}
              </span>
              {o.remit ? ` — ${o.remit}` : ''}
            </p>
          ))}
        </div>
      )}

      {c.storage_location && (
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)', marginTop: 'var(--space-2)' }}>
          Stored at {c.storage_location}
        </p>
      )}

      {!isComplete && (
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
                onChange={(v) => onSetSharedFlag(c.id, 'described', v)}
              />
              <ToggleButton
                label="Sent back to vendor"
                checked={c.sent_back_to_vendor}
                onChange={(v) => onSetSharedFlag(c.id, 'sent_back_to_vendor', v)}
              />
            </>
          ) : (
            <>
              {mine && (
                <ToggleButton
                  label={shared ? 'Valued (your part)' : 'Valued'}
                  checked={mine.valued}
                  onChange={(v) => onSetMyValued(c.id, v)}
                />
              )}
              <ToggleButton
                label="Vendor emailed"
                checked={c.vendor_emailed}
                disabled={!c.valued}
                onChange={(v) => onSetSharedFlag(c.id, 'vendor_emailed', v)}
              />
            </>
          )}
        </div>
      )}

      {isAwaiting && chaser && onSetNeedsChasing && (
        <div style={{ marginTop: 'var(--space-3)', maxWidth: '320px' }}>
          <ToggleButton
            label={chaserLabel(chaser)}
            checked={c.needs_chasing}
            onChange={(v) => onSetNeedsChasing(c.id, v)}
          />
        </div>
      )}

      {!isComplete && !c.valued && waiting.length > 0 && !c.vendor_emailed && (
        <p style={{ fontSize: 'var(--size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
          {waiting.length === 1
            ? `Waiting on ${waiting[0]} before the vendor can be emailed.`
            : `Waiting on ${waiting.length} valuations before the vendor can be emailed.`}
        </p>
      )}

      <div
        style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <NotesField consignment={c} canEdit={!!mine} />
      </div>

      {footer && (
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          {footer}
        </div>
      )}
    </article>
  )
}
