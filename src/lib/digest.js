import { deriveStatus, STATUS, countdownLabel, daysInDept, plural } from './consignments'
import { taskDueLabel } from './tasks'

export function buildDigest({ consignments, tasks, specialists }) {
  const openConsignments = consignments.filter((c) => deriveStatus(c) !== STATUS.COMPLETE)
  const openTasks = tasks.filter((t) => !t.completed)

  const sections = specialists.map((s) => ({
    person: s,
    consignments: openConsignments
      .filter((c) => c.assigned_to === s.id)
      .sort((a, b) => daysInDept(b) - daysInDept(a)),
    tasks: openTasks.filter((t) => t.assigned_to === s.id),
  }))

  const unassigned = openConsignments.filter(
    (c) => !specialists.some((s) => s.id === c.assigned_to)
  )

  return { sections, unassigned, totalConsignments: openConsignments.length, totalTasks: openTasks.length }
}

function consignmentLine(c) {
  return `${c.receipt_number} — ${c.vendor_name} (${c.box_count} ${plural(c.box_count, 'box')}) — ${countdownLabel(c)}`
}

function taskLine(t) {
  return `${t.title} — ${taskDueLabel(t)}`
}

export function specialistText(section) {
  const first = section.person.full_name.split(' ')[0]
  const lines = [`Hello ${first},`, '', 'Here is what is outstanding this week.', '']

  if (section.tasks.length) {
    lines.push('TASKS', ...section.tasks.map((t) => `  ${taskLine(t)}`), '')
  }

  if (section.consignments.length) {
    lines.push('CONSIGNMENTS', ...section.consignments.map((c) => `  ${consignmentLine(c)}`), '')
  }

  if (!section.tasks.length && !section.consignments.length) {
    lines.push('Nothing outstanding. Thank you.', '')
  }

  return lines.join('\n')
}

export function managerText(digest) {
  const lines = [
    `${digest.totalConsignments} open ${plural(digest.totalConsignments, 'consignment')} and ${digest.totalTasks} open ${plural(digest.totalTasks, 'task')}.`,
    '',
  ]

  for (const section of digest.sections) {
    if (!section.consignments.length && !section.tasks.length) continue
    lines.push(section.person.full_name.toUpperCase(), '')
    if (section.tasks.length) {
      lines.push('  Tasks', ...section.tasks.map((t) => `    ${taskLine(t)}`), '')
    }
    if (section.consignments.length) {
      lines.push('  Consignments', ...section.consignments.map((c) => `    ${consignmentLine(c)}`), '')
    }
  }

  if (digest.unassigned.length) {
    lines.push('UNASSIGNED', '', ...digest.unassigned.map((c) => `  ${consignmentLine(c)}`), '')
  }

  return lines.join('\n')
}

export function mailtoLink(email, subject, body) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
