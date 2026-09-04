import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import Badge from '../components/Badge'
import { buildDigest, specialistText, managerText, mailtoLink } from '../lib/digest'
import { countdownLabel, urgency, formatDateLong, plural } from '../lib/consignments'
import { taskDueLabel, taskUrgency } from '../lib/tasks'

const TONE = { overdue: 'danger', soon: 'gold', frozen: 'navy', ok: 'neutral', none: 'neutral', done: 'success' }

export default function Digest() {
  const { consignments, tasks, specialists, currentUser } = useStore()
  const [copied, setCopied] = useState(null)

  const digest = useMemo(
    () => buildDigest({ consignments, tasks, specialists }),
    [consignments, tasks, specialists]
  )

  async function copy(key, text) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied((k) => (k === key ? null : k)), 3000)
    } catch {
      setCopied('failed')
    }
  }

  function download() {
    const text = managerText(digest)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `consignments-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const subjectFor = () => 'Your outstanding work this week'

  return (
    <>
      <header style={{ marginBottom: 'var(--space-5)' }}>
        <h1>Weekly digest</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
          {formatDateLong(new Date())} · {digest.totalConsignments} open {plural(digest.totalConsignments, 'consignment')}, {digest.totalTasks} open {plural(digest.totalTasks, 'task')}
        </p>
      </header>

      <div
        style={{
          background: 'var(--navy-tint)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
          fontSize: 'var(--size-sm)',
        }}
      >
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <strong>Open in email</strong> starts a message in your mail app with everything filled in.
          <strong> Copy</strong> puts the text on your clipboard to paste in yourself.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <ActionButton onClick={() => copy('manager', managerText(digest))}>
            {copied === 'manager' ? 'Copied' : 'Copy the whole digest'}
          </ActionButton>
          <ActionButton onClick={download}>Download as a file</ActionButton>
        </div>
      </div>

      {copied === 'failed' && (
        <p role="alert" style={{ color: 'var(--danger)', fontSize: 'var(--size-sm)', marginBottom: 'var(--space-4)' }}>
          Your browser blocked the copy. Select the text and copy it manually.
        </p>
      )}

      {digest.sections.map((section) => {
        const body = specialistText(section)
        const nothing = !section.consignments.length && !section.tasks.length

        return (
          <section
            key={section.person.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                flexWrap: 'wrap',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 'var(--size-lg)' }}>{section.person.full_name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
                  {section.person.email}
                </p>
              </div>
              {!nothing && (
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <ActionButton onClick={() => copy(section.person.id, body)}>
                    {copied === section.person.id ? 'Copied' : 'Copy'}
                  </ActionButton>
                  
                    href={mailtoLink(section.person.email, subjectFor(), body)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: 'var(--control-height)',
                      padding: '0 var(--space-4)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--navy)',
                      color: 'var(--text-on-dark)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: 'var(--size-sm)',
                    }}
                  >
                    Open in email
                  </a>
                </div>
              )}
            </div>

            {nothing ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}>
                Nothing outstanding. No need to email.
              </p>
            ) : (
              <>
                {section.tasks.length > 0 && (
                  <List
                    heading="Tasks"
                    items={section.tasks.map((t) => ({
                      key: t.id,
                      main: t.title,
                      note: taskDueLabel(t),
                      tone: TONE[taskUrgency(t)],
                    }))}
                  />
                )}
                {section.consignments.length > 0 && (
                  <List
                    heading="Consignments"
                    items={section.consignments.map((c) => ({
                      key: c.id,
                      main: c.receipt_number,
                      mono: true,
                      sub: `${c.vendor_name} · ${c.box_count} ${plural(c.box_count, 'box')}`,
                      note: countdownLabel(c),
                      tone: TONE[urgency(c)],
                    }))}
                  />
                )}
              </>
            )}
          </section>
        )
      })}

      {digest.unassigned.length > 0 && (
        <section
          style={{
            background: 'var(--danger-tint)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
          }}
        >
          <h2 style={{ fontSize: 'var(--size-lg)', color: 'var(--danger)', marginBottom: 'var(--space-3)' }}>
            Unassigned
          </h2>
          <List
            items={digest.unassigned.map((c) => ({
              key: c.id,
              main: c.receipt_number,
              mono: true,
              sub: c.vendor_name,
              note: countdownLabel(c),
              tone: TONE[urgency(c)],
            }))}
          />
        </section>
      )}
    </>
  )
}

function List({ heading, items }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      {heading && (
        <p style={{ fontWeight: 600, fontSize: 'var(--size-sm)', marginBottom: 'var(--space-2)' }}>
          {heading}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-2) 0',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <span className={item.mono ? 'receipt' : undefined} style={{ fontSize: 'var(--size-sm)' }}>
                {item.main}
              </span>
              {item.sub && (
                <span style={{ color: 'var(--text-muted)', fontSize: 'var(--size-sm)' }}> · {item.sub}</span>
              )}
            </div>
            <Badge tone={item.tone}>{item.note}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActionButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 'var(--control-height)',
        padding: '0 var(--space-4)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-strong)',
        background: 'var(--surface)',
        fontWeight: 500,
        fontSize: 'var(--size-sm)',
      }}
    >
      {children}
    </button>
  )
}
