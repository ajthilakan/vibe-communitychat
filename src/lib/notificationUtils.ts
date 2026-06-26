import type { NotificationItem } from '../types'

// Human-readable label for a notification, e.g. "Ada replied in your thread" or
// "Ada reacted 👍 to your message". Kept pure so it's unit-tested without a DOM.
export function formatNotification(n: NotificationItem): string {
  if (n.type === 'reaction') {
    const emoji = n.emoji ? `${n.emoji} ` : ''
    return `${n.actor_name} reacted ${emoji}to your message`
  }
  return `${n.actor_name} replied in your thread`
}

// Insert or replace a notification by id, keeping the list newest-first. Used by
// both the initial load and the realtime INSERT echo (which may race the load).
export function upsertNotification(
  list: NotificationItem[],
  incoming: NotificationItem,
): NotificationItem[] {
  const next = list.some((n) => n.id === incoming.id)
    ? list.map((n) => (n.id === incoming.id ? incoming : n))
    : [incoming, ...list]

  return next.sort((a, b) => {
    const t = b.created_at.localeCompare(a.created_at)
    return t !== 0 ? t : b.id.localeCompare(a.id)
  })
}

// Count of unread (unopened) notifications — drives the bell badge.
export function unreadNotificationCount(list: NotificationItem[]): number {
  return list.reduce((n, item) => (item.read_at === null ? n + 1 : n), 0)
}

// Mark every notification read at the given time. Returns a new list; rows
// already read keep their original read_at so timestamps don't churn.
export function markAllRead(list: NotificationItem[], at: string): NotificationItem[] {
  return list.map((n) => (n.read_at === null ? { ...n, read_at: at } : n))
}
