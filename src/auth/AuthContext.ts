import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

// The signed-in user's own profile. display_name_set is false until they pick a
// name (the signup default is the email local-part), which drives the first-entry
// prompt. is_admin gates the moderation UI (delete / users panel) — UI hiding only;
// the real guard is RLS. Other users' profiles are never loaded here.
export interface UserProfile {
  display_name: string
  display_name_set: boolean
  is_admin: boolean
}

export interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  profile: UserProfile | null
  // Convenience flag derived from the loaded profile; false until it loads.
  isAdmin: boolean
  signOut: () => Promise<void>
  // Save the current user's display_name and mark it chosen. Throws on error.
  saveDisplayName: (name: string) => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
