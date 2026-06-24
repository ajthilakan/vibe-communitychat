import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Reaction } from '../types'
import { upsertReaction, removeReaction } from '../lib/reactionUtils'

interface ReactionRow {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

// Reactions for every message in a channel, kept live (U14). The initial load
// joins through messages to scope by channel; realtime then streams INSERT/DELETE
// events (RLS-scoped to the user's server) and we apply only those touching a
// message currently on screen. Toggling is optimistic — composite-key dedup means
// the realtime echo collapses onto the optimistic row rather than double-counting.
export function useChannelReactions(
  channelId: string | null,
  userId: string | undefined,
  visibleMessageIds: string[],
) {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const visibleRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    visibleRef.current = new Set(visibleMessageIds)
  }, [visibleMessageIds])

  useEffect(() => {
    if (!channelId) {
      setReactions([])
      return
    }
    let active = true
    setReactions([])

    supabase
      .from('reactions')
      .select('id,message_id,user_id,emoji,messages!inner(channel_id)')
      .eq('messages.channel_id', channelId)
      .then(({ data, error }) => {
        if (!active || error || !data) return
        setReactions(
          data.map((r) => {
            const row = r as unknown as ReactionRow
            return {
              id: row.id,
              message_id: row.message_id,
              user_id: row.user_id,
              emoji: row.emoji,
            }
          }),
        )
      })

    const channel = supabase
      .channel(`reactions:${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reactions' },
        (payload) => {
          const row = payload.new as ReactionRow
          if (!active || !visibleRef.current.has(row.message_id)) return
          setReactions((prev) => upsertReaction(prev, row))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reactions' },
        (payload) => {
          const row = payload.old as ReactionRow
          if (!active || !row?.message_id) return
          setReactions((prev) => removeReaction(prev, row))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [channelId])

  // Toggle the current user's reaction for one emoji on one message.
  const toggle = useCallback(
    async (messageId: string, emoji: string, mine: boolean) => {
      if (!userId) return
      const target = { message_id: messageId, user_id: userId, emoji }
      if (mine) {
        setReactions((prev) => removeReaction(prev, target))
        await supabase
          .from('reactions')
          .delete()
          .match({ message_id: messageId, user_id: userId, emoji })
      } else {
        setReactions((prev) =>
          upsertReaction(prev, { id: `optimistic-${messageId}-${emoji}`, ...target }),
        )
        await supabase
          .from('reactions')
          .insert({ message_id: messageId, user_id: userId, emoji })
      }
    },
    [userId],
  )

  return { reactions, toggle }
}
