export function partsFor(consignmentId, assignments) {
  return assignments.filter((a) => a.consignment_id === consignmentId)
}

export function myPart(consignmentId, assignments, userId) {
  return assignments.find(
    (a) => a.consignment_id === consignmentId && a.specialist_id === userId
  ) || null
}

export function isShared(consignmentId, assignments) {
  return partsFor(consignmentId, assignments).length > 1
}

export function allValued(consignmentId, assignments) {
  const parts = partsFor(consignmentId, assignments)
  return parts.length > 0 && parts.every((p) => p.valued)
}

export function valuationProgress(consignmentId, assignments) {
  const parts = partsFor(consignmentId, assignments)
  return { done: parts.filter((p) => p.valued).length, total: parts.length }
}

export function outstandingValuers(consignmentId, assignments, people) {
  return partsFor(consignmentId, assignments)
    .filter((p) => !p.valued)
    .map((p) => people.find((u) => u.id === p.specialist_id)?.full_name)
    .filter(Boolean)
}

export function consignmentsFor(userId, consignments, assignments) {
  const ids = new Set(
    assignments.filter((a) => a.specialist_id === userId).map((a) => a.consignment_id)
  )
  return consignments.filter((c) => ids.has(c.id))
}

export function nextActionShared(c, assignments, people) {
  if (c.described || c.sent_back_to_vendor) return null
  if (c.valued && c.vendor_emailed) return 'Waiting on the vendor'

  if (!c.valued) {
    const waiting = outstandingValuers(c.id, assignments, people)
    if (waiting.length === 0) return 'Needs assigning'
    if (waiting.length === 1) return `${waiting[0].split(' ')[0]} to value`
    return `${waiting.length} still to value`
  }

  return 'Needs vendor emailing'
}
