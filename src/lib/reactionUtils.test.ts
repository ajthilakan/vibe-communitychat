import { describe, it, expect } from 'vitest'
import {
  aggregateReactions,
  upsertReaction,
  removeReaction,
  reactionKey,
} from './reactionUtils'
import type { Reaction } from '../types'

function reaction(over: Partial<Reaction>): Reaction {
  return { id: 'r1', message_id: 'm1', user_id: 'u1', emoji: '👍', ...over }
}

describe('aggregateReactions', () => {
  it('returns empty for no reactions', () => {
    expect(aggregateReactions([], 'u1')).toEqual([])
  })

  it('counts reactions per emoji and flags the current user', () => {
    const rows = [
      reaction({ id: '1', user_id: 'u1', emoji: '👍' }),
      reaction({ id: '2', user_id: 'u2', emoji: '👍' }),
      reaction({ id: '3', user_id: 'u2', emoji: '🎉' }),
    ]
    const result = aggregateReactions(rows, 'u1')
    expect(result).toEqual([
      { emoji: '👍', count: 2, mine: true },
      { emoji: '🎉', count: 1, mine: false },
    ])
  })

  it('preserves first-appearance order', () => {
    const rows = [
      reaction({ id: '1', emoji: '🎉' }),
      reaction({ id: '2', emoji: '👍' }),
    ]
    expect(aggregateReactions(rows, undefined).map((r) => r.emoji)).toEqual(['🎉', '👍'])
  })

  it('mine is false when there is no current user', () => {
    const rows = [reaction({ user_id: 'u1', emoji: '👍' })]
    expect(aggregateReactions(rows, undefined)[0].mine).toBe(false)
  })
})

describe('upsertReaction', () => {
  it('collapses an optimistic row and its realtime echo into one (same composite key)', () => {
    const optimistic = reaction({ id: 'temp', message_id: 'm1', user_id: 'u1', emoji: '👍' })
    const echoed = reaction({ id: 'real', message_id: 'm1', user_id: 'u1', emoji: '👍' })
    const result = upsertReaction([optimistic], echoed)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('real')
  })

  it('keeps distinct emojis from the same user separate', () => {
    const a = reaction({ id: '1', emoji: '👍' })
    const b = reaction({ id: '2', emoji: '🎉' })
    expect(upsertReaction([a], b)).toHaveLength(2)
  })
})

describe('removeReaction', () => {
  it('removes by composite key regardless of row id', () => {
    const a = reaction({ id: '1', message_id: 'm1', user_id: 'u1', emoji: '👍' })
    const b = reaction({ id: '2', message_id: 'm1', user_id: 'u2', emoji: '👍' })
    const result = removeReaction([a, b], { message_id: 'm1', user_id: 'u1', emoji: '👍' })
    expect(result.map((r) => r.id)).toEqual(['2'])
  })
})

describe('reactionKey', () => {
  it('is stable for the same triple and distinct across emoji', () => {
    const base = { message_id: 'm1', user_id: 'u1', emoji: '👍' }
    expect(reactionKey(base)).toBe(reactionKey({ ...base }))
    expect(reactionKey(base)).not.toBe(reactionKey({ ...base, emoji: '🎉' }))
  })
})
