import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).',
  )
}

// The anon/publishable key is public by design (ships in the browser). RLS protects the data.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
