import { describe, it, expect } from 'vitest'
import {
  formatNotification,
  upsertNotification,
  unreadNotificationCount,
  markAllRead,
} from './notificationUtils'
import type { NotificationItem } from '../types'

function notif(over: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n1',
    type: 'thread_reply',
    actor_name: 'Ada',
    channel_id: 'c1',
    message_id: 'm1',
    thread_root_id: 'm1',
    emoji: null,
    created_at: '2026-01-01T00:00:00Z',
    read_at: null,
    ...over,
  }
}

describe('formatNotification', () => {
  it('labels a thread reply', () => {
    expect(formatNotification(notif({}))).toBe('Ada replied in your thread')
  })

  it('labels a reaction with its emoji', () => {
    expect(formatNotification(notif({ type: 'reaction', emoji: '👍' }))).toBe(
      'Ada reacted 👍 to your message',
    )
  })

  it('labels a reaction with no emoji gracefully', () => {
    expect(formatNotification(notif({ type: 'reaction', emoji: null }))).toBe(
      'Ada reacted to your message',
    )
  })
})

describe('upsertNotification', () => {
  it('prepends a new notification and keeps newest-first order', () => {
    const list = [notif({ id: 'a', created_at: '2026-01-01T00:00:00Z' })]
    const next = upsertNotification(list, notif({ id: 'b', created_at: '2026-01-02T00:00:00Z' }))
    expect(next.map((n) => n.id)).toEqual(['b', 'a'])
  })

  it('replaces an existing notification by id without duplicating', () => {
    const list = [notif({ id: 'a', read_at: null })]
    const next = upsertNotification(list, notif({ id: 'a', read_at: '2026-02-01T00:00:00Z' }))
    expect(next).toHaveLength(1)
    expect(next[0].read_at).toBe('2026-02-01T00:00:00Z')
  })
})

describe('unreadNotificationCount', () => {
  it('counts only unread rows', () => {
    const list = [notif({ id: 'a', read_at: null }), notif({ id: 'b', read_at: '2026-01-03T00:00:00Z' })]
    expect(unreadNotificationCount(list)).toBe(1)
  })
})

describe('markAllRead', () => {
  it('stamps unread rows and leaves already-read timestamps intact', () => {
    const list = [
      notif({ id: 'a', read_at: null }),
      notif({ id: 'b', read_at: '2026-01-01T00:00:00Z' }),
    ]
    const next = markAllRead(list, '2026-03-01T00:00:00Z')
    expect(next[0].read_at).toBe('2026-03-01T00:00:00Z')
    expect(next[1].read_at).toBe('2026-01-01T00:00:00Z')
  })
})
