import { describe, it, expect } from 'vitest'
import { parseAuthError } from './authError'

describe('parseAuthError', () => {
  it('returns null when the hash has no error', () => {
    expect(parseAuthError('')).toBeNull()
    expect(parseAuthError('#access_token=abc&type=magiclink')).toBeNull()
  })

  it('returns the decoded description for a failed link', () => {
    expect(
      parseAuthError('#error=access_denied&error_description=Email+link+is+invalid+or+has+expired'),
    ).toBe('Email link is invalid or has expired')
  })

  it('handles a hash without the leading #', () => {
    expect(parseAuthError('error=otp_expired&error_description=Token+expired')).toBe(
      'Token expired',
    )
  })

  it('falls back to a generic message when error has no description', () => {
    expect(parseAuthError('#error=otp_expired')).toBe(
      'That sign-in link is invalid or has expired.',
    )
  })
})
