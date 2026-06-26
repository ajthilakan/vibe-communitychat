import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { computeUnreadChannels, type ChannelActivity } from '../lib/unreadUtils'

// Channel-level unread tracking (0011). Loads the user's read pointers + latest
// per-channel activity once, then keeps an "unread channels" set live by watching
// the server-wide messages stream. Marking a channel read (on enter and on leave)
// upserts its pointer to now. baselineFor exposes the pre-visit pointer so the
// channel view can highlight threads that moved since the last visit.
//
// Read-only / logged-out visitors pass userId = undefined: the hook stays inert
// (no subscription, empty unread set).
export function useUnread(userId: string | undefined, activeChannelId: string | null) {
  const [unreadChannelIds, setUnreadChannelIds] = useState<Set<string>>(new Set())
  // channelId -> last_read_at ISO. Mutated in place so the realtime callback and
  // baselineFor see the latest value without re-subscribing.
  const readsRef = useRef<Map<string, string>>(new Map())
  const activeRef = useRef<string | null>(activeChannelId)

  useEffect(() => {
    activeRef.current = activeChannelId
  }, [activeChannelId])

  // Persist a channel's read pointer and drop it from the unread set.
  const markChannelRead = useCallback(
    async (channelId: string) => {
      if (!userId) return
      const now = new Date().toISOString()
      readsRef.current.set(channelId, now)
      setUnreadChannelIds((prev) => {
        if (!prev.has(channelId)) return prev
        const next = new Set(prev)
        next.delete(channelId)
        return next
      })
      const { error } = await supabase
        .from('channel_reads')
        .upsert(
          { user_id: userId, channel_id: channelId, last_read_at: now },
          { onConflict: 'user_id,channel_id' },
        )
      if (error) console.error('Failed to mark channel read:', error.message)
    },
    [userId],
  )

  // Initial load: read pointers + latest activity → initial unread set.
  useEffect(() => {
    if (!userId) {
      readsRef.current = new Map()
      setUnreadChannelIds(new Set())
      return
    }
    let active = true
    Promise.all([
      supabase.from('channel_reads').select('channel_id,last_read_at').eq('user_id', userId),
      supabase.rpc('channel_unread_state'),
    ]).then(([readsRes, activityRes]) => {
      if (!active) return
      if (readsRes.error) console.error('Failed to load read pointers:', readsRes.error.message)
      const reads = new Map<string, string>()
      for (const r of readsRes.data ?? []) {
        reads.set(r.channel_id as string, r.last_read_at as string)
      }
      readsRef.current = reads
      const activity = (activityRes.data ?? []) as ChannelActivity[]
      const initial = computeUnreadChannels(activity, reads)
      // The channel we're already looking at isn't "unread" — drop it (and the
      // enter effect below persists the pointer).
      if (activeRef.current) initial.delete(activeRef.current)
      setUnreadChannelIds(initial)
    })
    return () => {
      active = false
    }
  }, [userId])

  // Server-wide new-message watch. A message in a non-active channel (by someone
  // else) marks that channel unread; one in the active channel is ignored (you're
  // looking at it — the leave effect will persist the pointer).
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('unread:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as { channel_id: string; user_id: string }
          if (row.user_id === userId) return
          if (row.channel_id === activeRef.current) return
          setUnreadChannelIds((prev) => {
            if (prev.has(row.channel_id)) return prev
            const next = new Set(prev)
            next.add(row.channel_id)
            return next
          })
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Mark the active channel read on enter and again on leave (so messages watched
  // live during the visit don't resurface as unread next time).
  useEffect(() => {
    if (!userId || !activeChannelId) return
    void markChannelRead(activeChannelId)
    return () => {
      void markChannelRead(activeChannelId)
    }
  }, [userId, activeChannelId, markChannelRead])

  // The read pointer as it stood before this visit's mark — used for thread
  // highlighting. Captured by the channel view at mount, before the enter effect.
  const baselineFor = useCallback((channelId: string | null): string | null => {
    if (!channelId) return null
    return readsRef.current.get(channelId) ?? null
  }, [])

  return { unreadChannelIds, markChannelRead, baselineFor }
}
