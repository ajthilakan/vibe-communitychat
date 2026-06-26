import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { TYPING_THROTTLE_MS, TYPING_TIMEOUT_MS } from '../lib/typingUtils'

interface TypingPayload {
  user_id: string
  display_name: string
}

interface ActiveTyper {
  name: string
  timer: ReturnType<typeof setTimeout>
}

// Lightweight "who's typing" for the active channel, over a Supabase Realtime
// broadcast channel (ephemeral — no DB). The composer calls notifyTyping() as the
// user types; we throttle outbound pings to one per TYPING_THROTTLE_MS. Inbound
// pings refresh a per-user expiry timer, so a name auto-clears after
// TYPING_TIMEOUT_MS of silence (the sender simply stops pinging when idle), or
// immediately via clearUser() once that person's message lands. Broadcast self is
// off by default, so we never see our own pings. Scoped to channelId only.
export function useTyping(
  channelId: string | null,
  userId: string | undefined,
  displayName: string,
) {
  const [typingNames, setTypingNames] = useState<string[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastSentRef = useRef(0)
  const activeRef = useRef<Map<string, ActiveTyper>>(new Map())

  const recompute = useCallback(() => {
    setTypingNames([...activeRef.current.values()].map((t) => t.name))
  }, [])

  const clearUser = useCallback(
    (id: string) => {
      const entry = activeRef.current.get(id)
      if (!entry) return
      clearTimeout(entry.timer)
      activeRef.current.delete(id)
      recompute()
    },
    [recompute],
  )

  useEffect(() => {
    const typers = activeRef.current
    typers.forEach((t) => clearTimeout(t.timer))
    typers.clear()
    setTypingNames([])

    if (!channelId) {
      channelRef.current = null
      return
    }

    const channel = supabase
      .channel(`typing:${channelId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as TypingPayload
        if (!p?.user_id || p.user_id === userId) return
        clearTimeout(typers.get(p.user_id)?.timer)
        const timer = setTimeout(() => {
          typers.delete(p.user_id)
          recompute()
        }, TYPING_TIMEOUT_MS)
        typers.set(p.user_id, { name: p.display_name || 'Someone', timer })
        recompute()
      })
      .subscribe()
    channelRef.current = channel

    return () => {
      typers.forEach((t) => clearTimeout(t.timer))
      typers.clear()
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [channelId, userId, recompute])

  // Throttled outbound "I'm typing" ping. No-op for read-only (no userId).
  const notifyTyping = useCallback(() => {
    const channel = channelRef.current
    if (!channel || !userId) return
    const now = Date.now()
    if (now - lastSentRef.current < TYPING_THROTTLE_MS) return
    lastSentRef.current = now
    void channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, display_name: displayName },
    })
  }, [userId, displayName])

  return { typingNames, notifyTyping, clearUser }
}
