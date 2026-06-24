import type { Message, ReactionSummary } from '../types'
import { ReactionBar } from './ReactionBar'

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// One rendered message: author, timestamp, body, reaction bar, and (for top-level
// messages in the main list) a reply affordance with count. Reused by MessageList
// and ThreadPanel.
export function MessageItem({
  message,
  summaries,
  onToggleReaction,
  replyCount,
  onOpenThread,
}: {
  message: Message
  summaries: ReactionSummary[]
  onToggleReaction: (messageId: string, emoji: string, mine: boolean) => void
  replyCount?: number
  onOpenThread?: () => void
}) {
  return (
    <div className="message">
      <div className="message-head">
        <span className="message-author">{message.author_name}</span>
        <span className="message-time">{formatTime(message.created_at)}</span>
      </div>
      <div className="message-body">{message.body}</div>
      <ReactionBar
        summaries={summaries}
        onToggle={(emoji, mine) => onToggleReaction(message.id, emoji, mine)}
      />
      {onOpenThread && (
        <button type="button" className="thread-link" onClick={onOpenThread}>
          {replyCount
            ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
            : 'Reply in thread'}
        </button>
      )}
    </div>
  )
}
