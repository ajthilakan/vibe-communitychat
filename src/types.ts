// Shared domain types for CommunityChat. These mirror the Postgres schema
// (supabase/migrations/0001_schema.sql) and the embedded author join used in
// message reads.

export interface Channel {
  id: string
  server_id: string
  slug: string
  name: string
  position: number
}

export interface Profile {
  id: string
  display_name: string
}

// A message row plus its author's display name. Supabase embeds the related
// profile via the foreign key; we flatten it to author_name for rendering.
export interface Message {
  id: string
  channel_id: string
  user_id: string
  parent_message_id: string | null
  body: string
  created_at: string
  author_name: string
}

export interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

// Aggregated reaction state for one emoji on one message.
export interface ReactionSummary {
  emoji: string
  count: number
  mine: boolean
}

export type NotificationType = 'thread_reply' | 'reaction'

// A notification row (notifications table, 0012) flattened for rendering: the
// actor's display_name is joined in, and thread_root_id/channel_id drive the
// click-through to the right channel + thread. read_at = null means unread.
export interface NotificationItem {
  id: string
  type: NotificationType
  actor_name: string
  channel_id: string
  message_id: string
  thread_root_id: string | null
  emoji: string | null
  created_at: string
  read_at: string | null
}
