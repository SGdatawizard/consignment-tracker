import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { profile } = useAuth()
  const currentUserId = profile.id

  const [consignments, setConsignments] = useState([])
  const [assignments, setAssignments] = useState([])
  const [history, setHistory] = useState([])
  const [tasks, setTasks] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  const load = useCallback(async () => {
    const [c, a, h, t, p] = await Promise.all([
      supabase.from('consignments').select('*').is('deleted_at', null).order('arrival_date'),
      supabase.from('consignment_assignments').select('*'),
      supabase.from('assignment_history').select('*'),
      supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('active', true).order('full_name'),
    ])

    const failure = [c, a, h, t, p].find((r) => r.error)
    if (failure) {
      setError(failure.error.message)
      setLoading(false)
      return
    }

    setConsignments(c.data)
    setAssignments(a.data)
    setHistory(h.data)
    setTasks(t.data)
    setPeople(p.data)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const specialists = people.filter((p) => p.role === 'specialist')

  async function refreshConsignment(id) {
    const [{ data: c }, { data: a }] = await Promise.all([
      supabase.from('consignments').select('*').eq('id', id).single(),
      supabase.from('consignment_assignments').select('*').eq('consignment_id', id),
    ])

    if (c) setConsignments((prev) => prev.map((row) => (row.id === id ? c : row)))
    if (a) {
      setAssignments((prev) => [...prev.filter((row) => row.consignment_id !== id), ...a])
    }
    return c
  }

  async function refreshHistory(consignmentId) {
    const { data } = await supabase
      .from('assignment_history')
      .select('*')
      .eq('consignment_id', consignmentId)
    if (data) {
      setHistory((prev) => [
        ...prev.filter((h) => h.consignment_id !== consignmentId),
        ...data,
      ])
    }
  }

  // -- my valuation ------------------------------------------

  async function setMyValued(consignmentId, value) {
    const part = assignments.find(
      (a) => a.consignment_id === consignmentId && a.specialist_id === currentUserId
    )
    if (!part) return

    const before = consignments.find((c) => c.id === consignmentId)

    setAssignments((prev) =>
      prev.map((a) => (a.id === part.id ? { ...a, valued: value } : a))
    )

    const { error: err } = await supabase
      .from('consignment_assignments')
      .update({ valued: value })
      .eq('id', part.id)

    if (err) {
      setAssignments((prev) => prev.map((a) => (a.id === part.id ? part : a)))
      setError(err.message)
      return
    }

    const after = await refreshConsignment(consignmentId)
    if (after && before && after.status !== before.status) {
      setLastChange({
        id: consignmentId,
        receipt: after.receipt_number,
        movedTo: after.status,
        revert: { kind: 'assignment', id: part.id, value: !value },
      })
    }
  }

  // -- shared flags ------------------------------------------

  async function setSharedFlag(consignmentId, field, value) {
    const before = consignments.find((c) => c.id === consignmentId)
    if (!before) return

    setConsignments((prev) =>
      prev.map((c) => (c.id === consignmentId ? { ...c, [field]: value } : c))
    )

    const { data, error: err } = await supabase
      .from('consignments')
      .update({ [field]: value })
      .eq('id', consignmentId)
      .select()
      .single()

    if (err) {
      setConsignments((prev) => prev.map((c) => (c.id === consignmentId ? before : c)))
      setError(err.message)
      return
    }

    setConsignments((prev) => prev.map((c) => (c.id === consignmentId ? data : c)))

    if (data.status !== before.status) {
      setLastChange({
        id: consignmentId,
        receipt: data.receipt_number,
        movedTo: data.status,
        revert: { kind: 'consignment', field, value: before[field] },
      })
    }
  }

  async function undoLastChange() {
    if (!lastChange) return
    const { revert, id } = lastChange
    setLastChange(null)

    if (revert.kind === 'assignment') {
      const { error: err } = await supabase
        .from('consignment_assignments')
        .update({ valued: revert.value })
        .eq('id', revert.id)
      if (err) return setError(err.message)
    } else {
      const { error: err } = await supabase
        .from('consignments')
        .update({ [revert.field]: revert.value })
        .eq('id', id)
      if (err) return setError(err.message)
    }

    await refreshConsignment(id)
  }

  function dismissLastChange() {
    setLastChange(null)
  }

  // -- consignments ------------------------------------------

  async function addConsignment({ specialist_id, ...fields }) {
    const { data, error: err } = await supabase
      .from('consignments')
      .insert({ ...fields, intake_specialist_id: currentUserId })
      .select()
      .single()

    if (err) {
      setError(err.message)
      return null
    }

    const { error: assignErr } = await supabase
      .from('consignment_assignments')
      .insert({ consignment_id: data.id, specialist_id, created_by: currentUserId })

    if (assignErr) {
      setError(`Booked in, but assigning failed: ${assignErr.message}`)
    }

    setConsignments((prev) => [...prev, data])
    await refreshConsignment(data.id)
    return data
  }

  async function setStorageLocation(consignmentId, location) {
    const value = location || null
    const before = consignments.find((c) => c.id === consignmentId)
    if (!before || before.storage_location === value) return

    setConsignments((prev) =>
      prev.map((c) => (c.id === consignmentId ? { ...c, storage_location: value } : c))
    )

    const { error: err } = await supabase
      .from('consignments')
      .update({ storage_location: value })
      .eq('id', consignmentId)

    if (err) {
      setConsignments((prev) => prev.map((c) => (c.id === consignmentId ? before : c)))
      setError(err.message)
    }
  }

  // -- assignments -------------------------------------------

  async function addAssignment(consignmentId, specialistId, remit) {
    const { error: err } = await supabase
      .from('consignment_assignments')
      .insert({
        consignment_id: consignmentId,
        specialist_id: specialistId,
        remit: (remit || '').trim(),
        created_by: currentUserId,
      })

    if (err) {
      setError(
        err.code === '23505'
          ? 'That specialist is already on this consignment.'
          : err.message
      )
      return false
    }

    await refreshConsignment(consignmentId)
    await refreshHistory(consignmentId)
    return true
  }

  async function updateAssignment(assignmentId, changes) {
    const before = assignments.find((a) => a.id === assignmentId)
    if (!before) return

    setAssignments((prev) =>
      prev.map((a) => (a.id === assignmentId ? { ...a, ...changes } : a))
    )

    const { error: err } = await supabase
      .from('consignment_assignments')
      .update(changes)
      .eq('id', assignmentId)

    if (err) {
      setAssignments((prev) => prev.map((a) => (a.id === assignmentId ? before : a)))
      setError(
        err.code === '23505'
          ? 'That specialist is already on this consignment.'
          : err.message
      )
      return
    }

    await refreshConsignment(before.consignment_id)
    await refreshHistory(before.consignment_id)
  }

  async function removeAssignment(assignmentId) {
    const before = assignments.find((a) => a.id === assignmentId)
    if (!before) return

    const remaining = assignments.filter(
      (a) => a.consignment_id === before.consignment_id
    ).length

    if (remaining <= 1) {
      setError('A consignment needs at least one specialist. Change who it is assigned to instead of removing the last person.')
      return
    }

    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))

    const { error: err } = await supabase
      .from('consignment_assignments')
      .delete()
      .eq('id', assignmentId)

    if (err) {
      setAssignments((prev) => [...prev, before])
      setError(err.message)
      return
    }

    await refreshConsignment(before.consignment_id)
    await refreshHistory(before.consignment_id)
  }

  // -- tasks -------------------------------------------------

  async function addTask({ title, detail, assigned_to, due_date }) {
    const { data, error: err } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        detail: detail.trim(),
        assigned_to,
        due_date: due_date || null,
        created_by: currentUserId,
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      return null
    }

    setTasks((prev) => [data, ...prev])
    return data
  }

  async function toggleTask(id, completed) {
    const before = tasks.find((t) => t.id === id)
    if (!before) return

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)))

    const { data, error: err } = await supabase
      .from('tasks')
      .update({ completed })
      .eq('id', id)
      .select()
      .single()

    if (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)))
      setError(err.message)
      return
    }

    setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
  }

  async function reassignTask(taskId, toUserId) {
    const before = tasks.find((t) => t.id === taskId)
    if (!before || before.assigned_to === toUserId) return

    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assigned_to: toUserId } : t)))

    const { error: err } = await supabase
      .from('tasks')
      .update({ assigned_to: toUserId })
      .eq('id', taskId)

    if (err) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? before : t)))
      setError(err.message)
    }
  }

  const value = {
    consignments,
    assignments,
    history,
    tasks,
    people,
    specialists,
    currentUser: profile,
    currentUserId,
    loading,
    error,
    dismissError: () => setError(null),
    reload: load,
    setMyValued,
    setSharedFlag,
    addConsignment,
    setStorageLocation,
    addAssignment,
    updateAssignment,
    removeAssignment,
    addTask,
    toggleTask,
    reassignTask,
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
