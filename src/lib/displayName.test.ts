import { describe, it, expect } from 'vitest'
import { normalizeDisplayName, isValidDisplayName, DISPLAY_NAME_MAX } from './displayName'

describe('normalizeDisplayName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeDisplayName('  Alex  ')).toBe('Alex')
  })

  it('collapses internal whitespace runs', () => {
    expect(normalizeDisplayName('Alex   van  der  Berg')).toBe('Alex van der Berg')
  })
})

describe('isValidDisplayName', () => {
  it('accepts a normal name', () => {
    expect(isValidDisplayName('Alex')).toBe(true)
  })

  it('accepts a name padded with whitespace', () => {
    expect(isValidDisplayName('  Alex  ')).toBe(true)
  })

  it('rejects empty and whitespace-only input', () => {
    expect(isValidDisplayName('')).toBe(false)
    expect(isValidDisplayName('   ')).toBe(false)
  })

  it('rejects names longer than the max', () => {
    expect(isValidDisplayName('a'.repeat(DISPLAY_NAME_MAX + 1))).toBe(false)
  })

  it('accepts a name exactly at the max length', () => {
    expect(isValidDisplayName('a'.repeat(DISPLAY_NAME_MAX))).toBe(true)
  })
})
