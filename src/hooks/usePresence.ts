import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { uniqueMembers } from '../lib/presenceUtils'
import type { OnlineMember, PresenceState } from '../lib/presenceUtils'

// Who's online across the (single) server, via one Supabase Realtime presence
// channel. Signed-in users announce themselves with .track() — id + display_name
// only, never email; anon visitors still observe the list but don't appear in it.
// Presence is ephemeral (Realtime only, no DB), so nothing here persists. Mirrors
// the subscribe/removeChannel cleanup pattern in useChannelMessages.
export function usePresence(
  serverId: string | null,
  userId: string | undefined,
  displayName: string,
): OnlineMember[] {
  const [members, setMembers] = useState<OnlineMember[]>([])

  useEffect(() => {
    if (!serverId) {
      setMembers([])
      return
    }
    let active = true
    const channel = supabase.channel(`presence:server:${serverId}`, {
      config: { presence: { key: userId ?? '' } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!active) return
        setMembers(uniqueMembers(channel.presenceState() as unknown as PresenceState))
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || !userId) return
        void channel.track({ user_id: userId, display_name: displayName })
      })

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [serverId, userId, displayName])

  return members
}
