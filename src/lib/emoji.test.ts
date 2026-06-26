import { describe, it, expect } from 'vitest'
import { insertEmoji, MESSAGE_EMOJI } from './emoji'

describe('insertEmoji', () => {
  it('inserts at the caret position (collapsed selection)', () => {
    const { value, caret } = insertEmoji('ab', '🔥', 1, 1)
    expect(value).toBe('a🔥b')
    expect(caret).toBe(1 + '🔥'.length)
  })

  it('appends when the caret is at the end', () => {
    const { value, caret } = insertEmoji('hi', '🎉', 2, 2)
    expect(value).toBe('hi🎉')
    expect(caret).toBe(2 + '🎉'.length)
  })

  it('replaces a selected range', () => {
    const { value, caret } = insertEmoji('hello', '👍', 1, 4)
    expect(value).toBe('h👍o')
    expect(caret).toBe(1 + '👍'.length)
  })

  it('clamps out-of-range indices instead of producing undefined slices', () => {
    const { value, caret } = insertEmoji('hi', '✅', 99, 99)
    expect(value).toBe('hi✅')
    expect(caret).toBe(2 + '✅'.length)
  })
})

describe('MESSAGE_EMOJI', () => {
  it('is a curated, non-empty set with no duplicates', () => {
    expect(MESSAGE_EMOJI.length).toBeGreaterThanOrEqual(24)
    expect(new Set(MESSAGE_EMOJI).size).toBe(MESSAGE_EMOJI.length)
  })
})
