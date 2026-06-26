import { describe, it, expect } from 'vitest'
import { upsertMessage, replyCounts, removeMessage } from './messageUtils'
import type { Message } from '../types'

function msg(over: Partial<Message>): Message {
  return {
    id: 'm1',
    channel_id: 'c1',
    user_id: 'u1',
    parent_message_id: null,
    body: 'hi',
    created_at: '2026-06-24T10:00:00.000Z',
    author_name: 'aj',
    ...over,
  }
}

describe('upsertMessage', () => {
  it('appends a new message and keeps chronological order', () => {
    const a = msg({ id: 'a', created_at: '2026-06-24T10:00:00.000Z' })
    const c = msg({ id: 'c', created_at: '2026-06-24T10:02:00.000Z' })
    const b = msg({ id: 'b', created_at: '2026-06-24T10:01:00.000Z' })
    const result = upsertMessage([a, c], b)
    expect(result.map((m) => m.id)).toEqual(['a', 'b', 'c'])
  })

  it('replaces an existing message by id rather than duplicating (realtime echo)', () => {
    const a = msg({ id: 'a', body: 'first' })
    const dup = msg({ id: 'a', body: 'updated' })
    const result = upsertMessage([a], dup)
    expect(result).toHaveLength(1)
    expect(result[0].body).toBe('updated')
  })

  it('breaks created_at ties deterministically by id', () => {
    const a = msg({ id: 'a', created_at: '2026-06-24T10:00:00.000Z' })
    const b = msg({ id: 'b', created_at: '2026-06-24T10:00:00.000Z' })
    expect(upsertMessage([b], a).map((m) => m.id)).toEqual(['a', 'b'])
  })
})

describe('replyCounts', () => {
  it('counts replies per parent and ignores top-level messages', () => {
    const messages = [
      msg({ id: 'p', parent_message_id: null }),
      msg({ id: 'r1', parent_message_id: 'p' }),
      msg({ id: 'r2', parent_message_id: 'p' }),
      msg({ id: 'other', parent_message_id: null }),
    ]
    expect(replyCounts(messages)).toEqual({ p: 2 })
  })

  it('returns an empty record for no messages', () => {
    expect(replyCounts([])).toEqual({})
  })
})

describe('removeMessage', () => {
  it('removes the target message', () => {
    const a = msg({ id: 'a' })
    const b = msg({ id: 'b' })
    expect(removeMessage([a, b], 'a').map((m) => m.id)).toEqual(['b'])
  })

  it('also removes thread replies pointing at the deleted parent (cascade mirror)', () => {
    const parent = msg({ id: 'p', parent_message_id: null })
    const r1 = msg({ id: 'r1', parent_message_id: 'p' })
    const r2 = msg({ id: 'r2', parent_message_id: 'p' })
    const other = msg({ id: 'o', parent_message_id: null })
    expect(removeMessage([parent, r1, r2, other], 'p').map((m) => m.id)).toEqual(['o'])
  })

  it('is a no-op when the id is not present', () => {
    const a = msg({ id: 'a' })
    expect(removeMessage([a], 'zzz')).toHaveLength(1)
  })

  it('omits parents with zero replies (sparse map — callers rely on undefined being falsy)', () => {
    const counts = replyCounts([msg({ id: 'p', parent_message_id: null })])
    expect('p' in counts).toBe(false)
  })
})
