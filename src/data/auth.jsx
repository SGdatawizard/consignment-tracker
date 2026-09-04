import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [session])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    return error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = { session, profile, loading, signIn, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export const CAN = {
  bookIn: (role) => ['auctions', 'head_of_dept', 'admin'].includes(role),
  manage: (role) => ['head_of_dept', 'admin'].includes(role),
  ownWork: (role) => ['specialist', 'admin'].includes(role),
}
