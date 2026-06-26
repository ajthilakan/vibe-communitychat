// Curated emoji palette for the message composer (compose emoji into message text).
// Kept as a small, hand-picked set so we avoid a heavy emoji-picker dependency.
// Distinct from the reaction palette in ReactionBar — these go into the message body.
export const MESSAGE_EMOJI = [
  '😀', '😂', '🙂', '😉', '😍', '😎', '🤔', '😅',
  '😭', '😡', '👍', '👎', '🙏', '👏', '🙌', '💪',
  '🎉', '🔥', '✨', '⭐', '❤️', '💯', '👀', '✅',
  '❌', '⚠️', '🚀', '💡', '📌', '☕', '🤝', '👋',
] as const

// Inserts `emoji` into `value` at the [start, end) selection, replacing any
// selected text. Returns the new value and the caret position that should sit
// right after the inserted emoji. Pure so it can be unit-tested in isolation.
export function insertEmoji(
  value: string,
  emoji: string,
  start: number,
  end: number,
): { value: string; caret: number } {
  const clampedStart = Math.max(0, Math.min(start, value.length))
  const clampedEnd = Math.max(clampedStart, Math.min(end, value.length))
  const next = value.slice(0, clampedStart) + emoji + value.slice(clampedEnd)
  return { value: next, caret: clampedStart + emoji.length }
}
