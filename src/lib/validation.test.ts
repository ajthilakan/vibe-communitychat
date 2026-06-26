import { describe, it, expect } from 'vitest'
import { isValidEmail } from './validation'

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('aj@example.com')).toBe(true)
  })

  it('trims surrounding whitespace before validating', () => {
    expect(isValidEmail('  aj@example.com  ')).toBe(true)
  })

  it('rejects empty and whitespace-only input', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('   ')).toBe(false)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('@nolocal.com')).toBe(false)
    expect(isValidEmail('two@@at.com')).toBe(false)
  })

  it('rejects absurdly long input', () => {
    expect(isValidEmail('a'.repeat(320) + '@example.com')).toBe(false)
  })
})
