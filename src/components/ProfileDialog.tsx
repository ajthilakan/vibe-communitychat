import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { DISPLAY_NAME_MAX, isValidDisplayName } from '../lib/displayName'

// View and edit your own display name. Reused for two cases:
//   - firstTime: the first-entry nudge ("Pick a display name", "Skip for now").
//   - default: the edit surface opened from the header.
// Saving goes through AuthProvider.saveDisplayName, which is RLS-scoped to the
// caller's own row and sets display_name_set so the prompt won't appear again.
// Showing the user's own email here is fine — it's never another user's email.
export function ProfileDialog({
  firstTime = false,
  onClose,
}: {
  firstTime?: boolean
  onClose: () => void
}) {
  const { user, profile, saveDisplayName } = useAuth()
  const [name, setName] = useState(firstTime ? '' : (profile?.display_name ?? ''))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValidDisplayName(name)) {
      setError(`Please enter a name (1–${DISPLAY_NAME_MAX} characters).`)
      return
    }
    setSaving(true)
    setError('')
    try {
      await saveDisplayName(name)
      onClose()
    } catch {
      setSaving(false)
      setError('Could not save your name. Please try again.')
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Display name">
      <div className="modal-card">
        <h2>{firstTime ? 'Pick a display name' : 'Your profile'}</h2>
        <p>
          This is the name others see on your messages.
          {firstTime ? ' You can change it anytime.' : ''}
        </p>
        <form onSubmit={onSubmit}>
          <label className="field-label" htmlFor="display-name">
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            maxLength={DISPLAY_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex"
            aria-label="Display name"
            autoFocus
          />
          {user?.email && <p className="field-hint">Signed in as {user.email}</p>}
          {error && <p className="auth-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="link-button" onClick={onClose}>
              {firstTime ? 'Skip for now' : 'Cancel'}
            </button>
            <button type="submit" disabled={saving || name.trim().length === 0}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
