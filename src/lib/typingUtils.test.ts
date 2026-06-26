import { describe, it, expect } from 'vitest'
import { formatTypingText } from './typingUtils'

describe('formatTypingText', () => {
  it('returns empty string when nobody is typing', () => {
    expect(formatTypingText([])).toBe('')
  })

  it('formats a single name', () => {
    expect(formatTypingText(['Alice'])).toBe('Alice is typing…')
  })

  it('joins two names with "and"', () => {
    expect(formatTypingText(['Alice', 'Bob'])).toBe('Alice and Bob are typing…')
  })

  it('uses an Oxford-comma list for three names', () => {
    expect(formatTypingText(['Alice', 'Bob', 'Carol'])).toBe(
      'Alice, Bob, and Carol are typing…',
    )
  })

  it('collapses to a count past three names', () => {
    expect(formatTypingText(['Alice', 'Bob', 'Carol', 'Dan'])).toBe(
      'Several people are typing…',
    )
  })

  it('dedupes repeated names and drops empties', () => {
    expect(formatTypingText(['Alice', 'Alice', ''])).toBe('Alice is typing…')
  })
})
