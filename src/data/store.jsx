import { createContext, useContext, useState } from 'react'
import { SEED_CONSIGNMENTS, SEED_ASSIGNMENT_HISTORY } from './seedConsignments'
import { USERS } from './users'
import { deriveStatus, STATUS } from '../lib/consignments'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [consignments, setConsignments] = useState(SEED_CONSIGNMENTS)
  const [history, setHistory] = useState(SEED_ASSIGNMENT_HISTORY)
  const [currentUserId, setCurrentUserId] = useState('u3')
  const [lastChange, setLastChange] = useState(null)

  const currentUser = USERS.find((u) => u.id === currentUserId)

  function toggleFlag(id, field, value) {
    setConsignments((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c

        const before = deriveStatus(c)
        const next = { ...c, [field]: value, [`${field}_at`]: value ? new Date().toISOString() : null }
        const after = deriveStatus(next)

        if (before !== after) {
          if (after === STATUS.AWAITING_VENDOR) next.awaiting_vendor_at = new Date().toISOString()
          if (after === STATUS.IN_PROGRESS) next.awaiting_vendor_at = null
          if (after === STATUS.COMPLETE) next.completed_at = new Date().toISOString()
          else next.completed_at = null

          setLastChange({
            id: c.id,
            receipt: c.receipt_number,
            field,
            previousValue: c[field],
            movedTo: after,
            snapshot: c,
          })
        }

        return next
      })
    )
  }

  function undoLastChange() {
    if (!lastChange) return
    setConsignments((prev) =>
      prev.map((c) => (c.id === lastChange.id ? lastChange.snapshot : c))
    )
    setLastChange(null)
  }

  function dismissLastChange() {
    setLastChange(null)
  }

  function addConsignment(fields) {
    const record = {
      id: `c${Date.now()}`,
      storage_location: null,
      valued: false,
      valued_at: null,
      vendor_emailed: false,
      vendor_emailed_at: null,
      described: false,
      sent_back_to_vendor: false,
      awaiting_vendor_at: null,
      completed_at: null,
      ...fields,
    }
    setConsignments((prev) => [record, ...prev])
    return record
  }

  function reassign(consignmentId, toUserId) {
    const target = consignments.find((c) => c.id === consignmentId)
    if (!target || target.assigned_to === toUserId) return

    setHistory((prev) => [
      ...prev,
      {
        id: `h${Date.now()}`,
        consignment_id: consignmentId,
        from_user: target.assigned_to,
        to_user: toUserId,
        changed_by: currentUserId,
        changed_at: new Date().toISOString(),
      },
    ])
    setConsignments((prev) =>
      prev.map((c) => (c.id === consignmentId ? { ...c, assigned_to: toUserId } : c))
    )
  }

  function setStorageLocation(consignmentId, location) {
    setConsignments((prev) =>
      prev.map((c) => (c.id === consignmentId ? { ...c, storage_location: location || null } : c))
    )
  }

  const value = {
    consignments,
    history,
    users: USERS,
    currentUser,
    setCurrentUserId,
    toggleFlag,
    addConsignment,
    reassign,
    setStorageLocation,
    lastChange,
    undoLastChange,
    dismissLastChange,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
