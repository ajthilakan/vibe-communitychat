import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './AuthContext'
import type { UserProfile } from './AuthContext'
import { normalizeDisplayName } from '../lib/displayName'

// Owns the Supabase auth session. On mount it reads any existing session (and the
// session a magic-link click leaves in the URL, which supabase-js parses
// automatically), then subscribes to auth-state changes so sign-in, sign-out, and
// token refresh re-render the app. KTD-4: passwordless — there is no password here.
// It also loads the signed-in user's own profile so the header and first-entry
// display-name prompt can read display_name / display_name_set.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id ?? null

  // Load the current user's own profile row. Re-runs when the user changes.
  useEffect(() => {
    if (!userId) {
      setProfile(null)
      return
    }
    let active = true
    supabase
      .from('profiles')
      .select('display_name, display_name_set, is_admin')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (active) setProfile(data ?? null)
      })
    return () => {
      active = false
    }
  }, [userId])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    profile,
    isAdmin: profile?.is_admin ?? false,
    signOut: async () => {
      await supabase.auth.signOut()
    },
    // Update only the caller's own row (RLS policy "profiles: update own" enforces
    // this server-side) and mark display_name_set so the prompt won't nag again.
    saveDisplayName: async (name: string) => {
      if (!userId) return
      const display_name = normalizeDisplayName(name)
      const { error } = await supabase
        .from('profiles')
        .update({ display_name, display_name_set: true })
        .eq('id', userId)
      if (error) throw error
      setProfile((prev) => ({ ...prev, display_name, display_name_set: true, is_admin: prev?.is_admin ?? false }))
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
