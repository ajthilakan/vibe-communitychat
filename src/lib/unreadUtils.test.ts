import { describe, it, expect } from 'vitest'
import { computeUnreadChannels, unreadThreadParents } from './unreadUtils'
import type { Message } from '../types'

function msg(over: Partial<Message>): Message {
  return {
    id: 'm',
    channel_id: 'c1',
    user_id: 'u-other',
    parent_message_id: null,
    body: 'hi',
    created_at: '2026-01-01T00:00:00Z',
    author_name: 'Other',
    ...over,
  }
}

describe('computeUnreadChannels', () => {
  it('flags a channel whose latest activity is newer than the read pointer', () => {
    const reads = new Map([['c1', '2026-01-01T00:00:00Z']])
    const unread = computeUnreadChannels(
      [{ channel_id: 'c1', latest_at: '2026-01-02T00:00:00Z' }],
      reads,
    )
    expect(unread.has('c1')).toBe(true)
  })

  it('does not flag a channel read at or after its latest activity', () => {
    const reads = new Map([['c1', '2026-01-02T00:00:00Z']])
    const unread = computeUnreadChannels(
      [{ channel_id: 'c1', latest_at: '2026-01-02T00:00:00Z' }],
      reads,
    )
    expect(unread.has('c1')).toBe(false)
  })

  it('treats a never-visited channel (no pointer) as unread when it has activity', () => {
    const unread = computeUnreadChannels(
      [{ channel_id: 'c9', latest_at: '2026-01-01T00:00:00Z' }],
      new Map(),
    )
    expect(unread.has('c9')).toBe(true)
  })
})

describe('unreadThreadParents', () => {
  const baseline = '2026-01-01T12:00:00Z'

  it('collects parents of replies newer than the baseline by other users', () => {
    const messages = [
      msg({ id: 'p1', parent_message_id: null }),
      msg({ id: 'r1', parent_message_id: 'p1', created_at: '2026-01-01T13:00:00Z' }),
    ]
    expect(unreadThreadParents(messages, baseline, 'me')).toEqual(new Set(['p1']))
  })

  it('ignores replies older than the baseline', () => {
    const messages = [
      msg({ id: 'r1', parent_message_id: 'p1', created_at: '2026-01-01T11:00:00Z' }),
    ]
    expect(unreadThreadParents(messages, baseline, 'me').size).toBe(0)
  })

  it('ignores the current user\'s own replies', () => {
    const messages = [
      msg({ id: 'r1', parent_message_id: 'p1', created_at: '2026-01-01T13:00:00Z', user_id: 'me' }),
    ]
    expect(unreadThreadParents(messages, baseline, 'me').size).toBe(0)
  })

  it('yields no highlights when the baseline is null (never visited / not loaded)', () => {
    const messages = [
      msg({ id: 'r1', parent_message_id: 'p1', created_at: '2020-01-01T00:00:00Z' }),
    ]
    expect(unreadThreadParents(messages, null, 'me').size).toBe(0)
  })
})
