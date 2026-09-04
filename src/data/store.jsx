import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { profile } = useAuth()
  const currentUserId = profile.id

  const [consignments, setConsignments] = useState([])
  const [history, setHistory] = useState([])
  const [tasks, setTasks] = useState([])
  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastChange, setLastChange] = useState(null)

  const load = useCallback(async () => {
    const [c, h, t, p] = await Promise.all([
      supabase.from('consignments').select('*').is('deleted_at', null).order('arrival_date'),
      supabase.from('assignment_history').select('*'),
      supabase.from('tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').eq('active', true).order('full_name'),
    ])

    const failure = [c, h, t, p].find((r) => r.error)
    if (failure) {
      setError(failure.error.message)
      setLoading(false)
      return
    }

    setConsignments(c.data)
    setHistory(h.data)
    setTasks(t.data)
    setPeople(p.data)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const specialists = people.filter((p) => p.role === 'specialist')

  // -- consignments ------------------------------------------

  async function toggleFlag(id, field, value) {
    const before = consignments.find((c) => c.id === id)
    if (!before) return

    setConsignments((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))

    const { data, error: err } = await supabase
      .from('consignments')
      .update({ [field]: value })
      .eq('id', id)
      .select()
      .single()

    if (err) {
      setConsignments((prev) => prev.map((c) => (c.id === id ? before : c)))
      setError(err.message)
      return
    }

    setConsignments((prev) => prev.map((c) => (c.id === id ? data : c)))

    if (data.status !== before.status) {
      setLastChange({
        id,
        receipt: data.receipt_number,
        field,
        movedTo: data.status,
        snapshot: before,
      })
    }
  }

  async function undoLastChange() {
    if (!lastChange) return
    const { field, snapshot, id } = lastChange
    setLastChange(null)

    const { data, error: err } = await supabase
      .from('consignments')
      .update({ [field]: snapshot[field] })
      .eq('id', id)
      .select()
      .single()

    if (err) return setError(err.message)
    setConsignments((prev) => prev.map((c) => (c.id === id ? data : c)))
  }

  function dismissLastChange() {
    setLastChange(null)
  }

  async function addConsignment(fields) {
    const { data, error: err } = await supabase
      .from('consignments')
      .insert({ ...fields, intake_specialist_id: currentUserId })
      .select()
      .single()

    if (err) {
      setError(err.message)
      return null
    }

    setConsignments((prev) => [...prev, data])
    return data
  }

  async function reassign(consignmentId, toUserId) {
    const before = consignments.find((c) => c.id === consignmentId)
    if (!before || before.assigned_to === toUserId) return

    setConsignments((prev) =>
      prev.map((c) => (c.id === consignmentId ? { ...c, assigned_to: toUserId } : c))
    )

    const { data, error: err } = await supabase
      .from('consignments')
      .update({ assigned_to: toUserId })
      .eq('id', consignmentId)
      .select()
      .single()

    if (err) {
      setConsignments((prev) => prev.map((c) => (c.id === consignmentId ? before : c)))
      setError(err.message)
      return
    }

    setConsignments((prev) => prev.map((c) => (c.id === consignmentId ? data : c)))

    const { data: rows } = await supabase
      .from('assignment_history')
      .select('*')
      .eq('consignment_id', consignmentId)
    if (rows) {
      setHistory((prev) => [...prev.filter((h) => h.consignment_id !== consignmentId), ...rows])
    }
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
    toggleFlag,
    addConsignment,
    reassign,
    setStorageLocation,
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
