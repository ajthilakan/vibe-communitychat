import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Admin-only moderation panel: list members and block/unblock them. A blocked user
// can still read but cannot post (the messages INSERT policy in 0010 rejects their
// writes). Privacy: profiles holds no email, and we only ever read display_name —
// emails are never fetched or shown here. RLS is the real gate: the "profiles: admin
// update any" policy + guard trigger reject a non-admin's block attempt server-side,
// so this UI is a convenience, not the security boundary.
interface Row {
  id: string
  display_name: string
  blocked: boolean
  is_admin: boolean
}

export function UsersPanel({ currentUserId, onClose }: { currentUserId: string; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    supabase
      .from('profiles')
      .select('id, display_name, blocked, is_admin')
      .order('display_name', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setError('Could not load users.')
        } else {
          setRows((data as Row[]) ?? [])
        }
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function toggleBlocked(row: Row) {
    setBusyId(row.id)
    setError('')
    const next = !row.blocked
    const { error } = await supabase.from('profiles').update({ blocked: next }).eq('id', row.id)
    if (error) {
      setError(`Could not update ${row.display_name}.`)
    } else {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, blocked: next } : r)))
    }
    setBusyId(null)
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Manage users">
      <div className="modal-card users-card">
        <h2>Users</h2>
        <p>Block a member to stop them posting. They can still read the chat.</p>
        {error && <p className="auth-error">{error}</p>}
        {loading ? (
          <p className="field-hint">Loading users…</p>
        ) : (
          <ul className="users-list">
            {rows.map((r) => (
              <li key={r.id} className="users-row">
                <span className="users-name">
                  {r.display_name}
                  {r.is_admin && <span className="users-tag"> admin</span>}
                  {r.blocked && <span className="users-tag users-tag-blocked"> blocked</span>}
                </span>
                {/* No self/admin block toggle — avoids locking the owner out of posting. */}
                {!r.is_admin && r.id !== currentUserId && (
                  <button
                    type="button"
                    className="link-button"
                    disabled={busyId === r.id}
                    onClick={() => void toggleBlocked(r)}
                  >
                    {r.blocked ? 'Unblock' : 'Block'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="link-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
