// Pure helpers + tuning constants for the ephemeral "who's typing" indicator
// (Supabase Realtime broadcast — no DB). Labels are display names; we never
// broadcast email.

// How long a received "typing" ping stays live before we assume they stopped.
export const TYPING_TIMEOUT_MS = 4000
// Don't re-broadcast on every keystroke; at most one ping per this interval.
export const TYPING_THROTTLE_MS = 2000

// "<name> is typing…" — collapses to a count past a few names so the line never
// grows unbounded. Dedupes and drops empties defensively.
export function formatTypingText(names: string[]): string {
  const unique = [...new Set(names.filter((n) => n.length > 0))]
  if (unique.length === 0) return ''
  if (unique.length === 1) return `${unique[0]} is typing…`
  if (unique.length === 2) return `${unique[0]} and ${unique[1]} are typing…`
  if (unique.length === 3) {
    return `${unique[0]}, ${unique[1]}, and ${unique[2]} are typing…`
  }
  return 'Several people are typing…'
}
