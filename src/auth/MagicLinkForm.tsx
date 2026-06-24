import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isValidEmail } from '../lib/validation'

// One email field → signInWithOtp sends a magic link. The link click both logs
// the user in and verifies the email (KTD-4), so there is no password and no
// separate confirm step. emailRedirectTo brings the user back to this app, where
// AuthProvider picks up the session from the URL.
export function MagicLinkForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      setStatus('error')
      return
    }
    setStatus('sending')
    setError('')
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (otpError) {
      setError(otpError.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'sent') {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p>
          We sent a magic link to <strong>{email.trim()}</strong>. Click it to sign
          in — no password needed.
        </p>
        <button type="button" className="link-button" onClick={() => setStatus('idle')}>
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h1>CommunityChat</h1>
      <p>Sign in with a magic link. Enter your email and we'll send you a link.</p>
      <form onSubmit={onSubmit}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          required
        />
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
      {status === 'error' && <p className="auth-error">{error}</p>}
    </div>
  )
}
