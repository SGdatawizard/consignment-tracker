import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

const HeldItemsContext = createContext(null)

export function HeldItemsProvider({ children }) {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('held_items')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setItems(data)
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addItem(fields) {
    const { data, error: err } = await supabase
      .from('held_items')
      .insert({
        item_description: fields.item_description.trim(),
        held_for: fields.held_for.trim(),
        storage_location: fields.storage_location.trim() || null,
        expected_collection_date: fields.expected_collection_date || null,
        logged_by: profile.id,
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      return null
    }

    setItems((prev) => [data, ...prev])
    return data
  }

  async function updateItem(id, changes) {
    const before = items.find((i) => i.id === id)
    if (!before) return

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...changes } : i)))

    const { data, error: err } = await supabase
      .from('held_items')
      .update(changes)
      .eq('id', id)
      .select()
      .single()

    if (err) {
      setItems((prev) => prev.map((i) => (i.id === id ? before : i)))
      setError(err.message)
      return
    }

    setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
  }

  async function markCollected(id, note) {
    await updateItem(id, {
      collected: true,
      handed_over_note: (note || '').trim() || null,
    })
  }

  async function undoCollected(id) {
    await updateItem(id, { collected: false })
  }

  const value = {
    items,
    loading,
    error,
    dismissError: () => setError(null),
    reload: load,
    addItem,
    updateItem,
    markCollected,
    undoCollected,
  }

  return <HeldItemsContext.Provider value={value}>{children}</HeldItemsContext.Provider>
}

export function useHeldItems() {
  const ctx = useContext(HeldItemsContext)
  if (!ctx) throw new Error('useHeldItems must be used inside HeldItemsProvider')
  return ctx
}
