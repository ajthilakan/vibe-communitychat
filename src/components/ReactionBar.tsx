import { useState } from 'react'
import type { ReactionSummary } from '../types'

// Curated emoji set for v1 (kept small per the plan).
const PALETTE = ['👍', '❤️', '😂', '🎉', '👀', '🔥']

// Aggregated reaction chips for one message plus a small picker. Clicking a chip
// toggles the current user's reaction; the picker adds a new emoji. Counts update
// live via the parent's realtime subscription.
export function ReactionBar({
  summaries,
  onToggle,
}: {
  summaries: ReactionSummary[]
  onToggle: (emoji: string, mine: boolean) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="reaction-bar">
      {summaries.map((s) => (
        <button
          key={s.emoji}
          type="button"
          className={`reaction-chip${s.mine ? ' mine' : ''}`}
          onClick={() => onToggle(s.emoji, s.mine)}
          aria-pressed={s.mine}
          aria-label={`${s.emoji} ${s.count}${s.mine ? ', you reacted' : ''}`}
        >
          <span>{s.emoji}</span>
          <span className="reaction-count">{s.count}</span>
        </button>
      ))}

      <div className="reaction-add">
        <button
          type="button"
          className="reaction-chip add"
          onClick={() => setPickerOpen((o) => !o)}
          aria-label="Add reaction"
          aria-expanded={pickerOpen}
        >
          +
        </button>
        {pickerOpen && (
          <div className="reaction-picker" role="menu">
            {PALETTE.map((emoji) => {
              const existing = summaries.find((s) => s.emoji === emoji)
              return (
                <button
                  key={emoji}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onToggle(emoji, existing?.mine ?? false)
                    setPickerOpen(false)
                  }}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
