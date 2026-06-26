import type { Message } from '../types'

// Latest non-own activity for one channel, as returned by the channel_unread_state
// RPC (0011). latest_at is an ISO timestamp string.
export interface ChannelActivity {
  channel_id: string
  latest_at: string
}

// Which channels have unread messages: those whose latest non-own activity is
// newer than the user's read pointer. A missing pointer (never visited) is
// treated as the epoch (''), so a channel with any activity reads as unread.
// ISO-8601 timestamps compare correctly as plain strings (fixed-width, UTC).
export function computeUnreadChannels(
  activity: ChannelActivity[],
  reads: Map<string, string>,
): Set<string> {
  const unread = new Set<string>()
  for (const a of activity) {
    if (a.latest_at > (reads.get(a.channel_id) ?? '')) {
      unread.add(a.channel_id)
    }
  }
  return unread
}

// Thread parents (top-level message ids) that have a reply newer than the
// baseline and not written by the current user — i.e. threads that moved since
// the user's last visit to this channel. A null baseline (never visited, or read
// pointers not loaded yet) yields no highlights: the channel itself already reads
// as unread in the sidebar, and this avoids flagging every thread on first load.
export function unreadThreadParents(
  messages: Message[],
  baseline: string | null,
  myUserId: string | undefined,
): Set<string> {
  const parents = new Set<string>()
  if (baseline === null) return parents
  for (const m of messages) {
    if (m.parent_message_id && m.user_id !== myUserId && m.created_at > baseline) {
      parents.add(m.parent_message_id)
    }
  }
  return parents
}
