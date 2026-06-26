import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { NotificationItem, NotificationType } from '../types'
import {
  markAllRead as markAllReadUtil,
  unreadNotificationCount,
  upsertNotification,
} from '../lib/notificationUtils'

// The actor profile is embedded via the actor_id FK (disambiguated from user_id
// by constraint name). The realtime INSERT payload is the raw row only, so we
// re-fetch the inserted id with this select to get the joined actor name.
const SELECT =
  'id,type,emoji,channel_id,message_id,thread_root_id,created_at,read_at,' +
  'actor:profiles!notifications_actor_id_fkey(display_name)'

interface NotificationRow {
  id: string
  type: NotificationType
  emoji: string | null
  channel_id: string
  message_id: string
  thread_root_id: string | null
  created_at: string
  read_at: string | null
  actor: { display_name?: string } | { display_name?: string }[] | null
}

function mapRow(row: NotificationRow): NotificationItem {
  const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor
  return {
    id: row.id,
    type: row.type,
    actor_name: actor?.display_name ?? 'Someone',
    channel_id: row.channel_id,
    message_id: row.message_id,
    thread_root_id: row.thread_root_id,
    emoji: row.emoji,
    created_at: row.created_at,
    read_at: row.read_at,
  }
}

// Notifications for the signed-in user (0012): an initial newest-first load plus a
// realtime subscription scoped to their own rows. markAllRead stamps every unread
// row (optimistically, then in the DB) — called when the panel opens.
export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    if (!userId) {
      setItems([])
      return
    }
    let active = true

    supabase
      .from('notifications')
      .select(SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load notifications:', error.message)
          return
        }
        setItems((data ?? []).map((r) => mapRow(r as unknown as NotificationRow)))
      })

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const id = (payload.new as { id: string }).id
          const { data } = await supabase.from('notifications').select(SELECT).eq('id', id).single()
          if (!active || !data) return
          setItems((prev) => upsertNotification(prev, mapRow(data as unknown as NotificationRow)))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const now = new Date().toISOString()
    let hadUnread = false
    setItems((prev) => {
      hadUnread = prev.some((n) => n.read_at === null)
      return markAllReadUtil(prev, now)
    })
    if (!hadUnread) return
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)
    if (error) console.error('Failed to mark notifications read:', error.message)
  }, [userId])

  return { items, unreadCount: unreadNotificationCount(items), markAllRead }
}
