import { deriveStatus, STATUS, countdownLabel, daysInDept, plural } from './consignments'
import { partsFor, myPart, outstandingValuers } from './assignments'
import { taskDueLabel } from './tasks'

export function buildDigest({ consignments, assignments, tasks, specialists, people }) {
  const openConsignments = consignments.filter((c) => deriveStatus(c) !== STATUS.COMPLETE)
  const openTasks = tasks.filter((t) => !t.completed)

  const sections = specialists.map((s) => {
    const theirs = openConsignments
      .filter((c) => assignments.some((a) => a.consignment_id === c.id && a.specialist_id === s.id))
      .sort((a, b) => daysInDept(b) - daysInDept(a))
      .map((c) => ({
        consignment: c,
        part: myPart(c.id, assignments, s.id),
        shared: partsFor(c.id, assignments).length > 1,
        waitingOn: outstandingValuers(c.id, assignments, people),
      }))

    return {
      person: s,
      items: theirs,
      tasks: openTasks.filter((t) => t.assigned_to === s.id),
    }
  })

  const unassigned = openConsignments.filter((c) => partsFor(c.id, assignments).length === 0)

  return {
    sections,
    unassigned,
    totalConsignments: openConsignments.length,
    totalTasks: openTasks.length,
  }
}

function itemLine(item) {
  const c = item.consignment
  const bits = [`${c.receipt_number} — ${c.vendor_name} (${c.box_count} ${plural(c.box_count, 'box')})`]
  if (item.part?.remit) bits.push(`your part: ${item.part.remit}`)
  if (item.shared) bits.push('shared')
  bits.push(countdownLabel(c))
  return bits.join(' — ')
}

function plainLine(c) {
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

  if (section.items.length) {
    lines.push('CONSIGNMENTS', ...section.items.map((i) => `  ${itemLine(i)}`), '')
  }

  if (!section.tasks.length && !section.items.length) {
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
    if (!section.items.length && !section.tasks.length) continue
    lines.push(section.person.full_name.toUpperCase(), '')
    if (section.tasks.length) {
      lines.push('  Tasks', ...section.tasks.map((t) => `    ${taskLine(t)}`), '')
    }
    if (section.items.length) {
      lines.push('  Consignments', ...section.items.map((i) => `    ${itemLine(i)}`), '')
    }
  }

  if (digest.unassigned.length) {
    lines.push('UNASSIGNED', '', ...digest.unassigned.map((c) => `  ${plainLine(c)}`), '')
  }

  return lines.join('\n')
}

export function mailtoLink(email, subject, body) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
