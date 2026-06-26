// Pure helpers for ephemeral online presence (Supabase Realtime presence — no DB,
// nothing persisted). We track only a user id + display_name; never an email.

export interface OnlineMember {
  userId: string
  displayName: string
}

// One tracked presence meta as we register it via .track(). Supabase adds its own
// fields (presence_ref, …) too, but we only read these.
interface PresenceMeta {
  user_id?: string
  display_name?: string
}

// Supabase's presence state: keyed per presence key, each key holding one-or-more
// metas (e.g. the same user across tabs/devices).
export type PresenceState = Record<string, readonly PresenceMeta[]>

// Collapse the raw presence state into one entry per user, sorted by display name
// so the online list renders stably.
export function uniqueMembers(state: PresenceState): OnlineMember[] {
  const byUser = new Map<string, OnlineMember>()
  for (const metas of Object.values(state)) {
    for (const meta of metas) {
      if (!meta.user_id || byUser.has(meta.user_id)) continue
      byUser.set(meta.user_id, {
        userId: meta.user_id,
        displayName: meta.display_name || 'Someone',
      })
    }
  }
  return [...byUser.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )
}
