import type { Message } from '../types'

// Realtime can deliver a message we already hold (e.g. it arrived in the initial
// load, or we inserted it ourselves). Upsert by id and keep the list ordered by
// created_at so the UI never shows duplicates or out-of-order messages.
export function upsertMessage(list: Message[], incoming: Message): Message[] {
  const next = list.some((m) => m.id === incoming.id)
    ? list.map((m) => (m.id === incoming.id ? incoming : m))
    : [...list, incoming]

  return next.sort((a, b) => {
    const t = a.created_at.localeCompare(b.created_at)
    return t !== 0 ? t : a.id.localeCompare(b.id)
  })
}

// Count of replies per parent message id, for the "N replies" indicator.
export function replyCounts(messages: Message[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const m of messages) {
    if (m.parent_message_id) {
      counts[m.parent_message_id] = (counts[m.parent_message_id] ?? 0) + 1
    }
  }
  return counts
}
