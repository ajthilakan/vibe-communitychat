import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Channel } from '../types'

// Load the channels the current user can see (RLS scopes this to servers they
// belong to — one server in v1), ordered by position. Channels are seeded and
// static, so a single fetch is enough; no realtime needed here.
export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('channels')
      .select('id,server_id,slug,name,position')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Failed to load channels:', error.message)
        else setChannels((data as Channel[]) ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return { channels, loading }
}
