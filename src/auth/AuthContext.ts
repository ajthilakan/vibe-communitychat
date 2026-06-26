import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | undefined>(undefined)
