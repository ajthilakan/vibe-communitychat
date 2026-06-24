import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Message } from '../types'
import { upsertMessage } from '../lib/messageUtils'

// Raw messages row as it comes back from the realtime INSERT payload (no join).
interface MessageRow {
  id: string
  channel_id: string
  user_id: string
  parent_message_id: string | null
  body: string
  created_at: string
}

// PostgREST embeds the author profile; normalize the object-or-array shape.
function authorName(profiles: unknown): string {
  const p = Array.isArray(profiles) ? profiles[0] : profiles
  const name = (p as { display_name?: string } | null)?.display_name
  return name ?? 'Unknown'
}

const SELECT = 'id,channel_id,user_id,parent_message_id,body,created_at,profiles(display_name)'

// Load and live-update every message in a channel — both top-level messages and
// thread replies (U9, U10, U11). One subscription per channel covers the whole
// channel; components split top-level vs. thread replies client-side. Author
// names are cached so realtime inserts (which arrive without the join) can be
// labelled without a round-trip in the common case.
export function useChannelMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const authorCache = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setMessages([])

    supabase
      .from('messages')
      .select(SELECT)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (!error && data) {
          const mapped: Message[] = data.map((row) => {
            const name = authorName((row as Record<string, unknown>).profiles)
            authorCache.current.set((row as MessageRow).user_id, name)
            return toMessage(row as unknown as MessageRow, name)
          })
          setMessages(mapped)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const row = payload.new as MessageRow
          const cached = authorCache.current.get(row.user_id)
          let name: string
          if (cached) {
            name = cached
          } else {
            const { data } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', row.user_id)
              .single()
            name = data?.display_name ?? 'Unknown'
            authorCache.current.set(row.user_id, name)
          }
          if (!active) return
          setMessages((prev) => upsertMessage(prev, toMessage(row, name)))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [channelId])

  return { messages, loading }
}

function toMessage(row: MessageRow, author_name: string): Message {
  return {
    id: row.id,
    channel_id: row.channel_id,
    user_id: row.user_id,
    parent_message_id: row.parent_message_id,
    body: row.body,
    created_at: row.created_at,
    author_name,
  }
}
