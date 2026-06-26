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
  readOnly = false,
  isAdmin = false,
  onDelete,
}: {
  message: Message
  summaries: ReactionSummary[]
  onToggleReaction: (messageId: string, emoji: string, mine: boolean) => void
  replyCount?: number
  onOpenThread?: () => void
  readOnly?: boolean
  isAdmin?: boolean
  onDelete?: (messageId: string) => void
}) {
  // Read-only viewers can still open a thread to READ replies, but the "start a
  // thread" prompt (0 replies) is hidden — there's nothing to read and they can't post.
  const showThreadLink = onOpenThread && (!readOnly || !!replyCount)

  // Admin-only delete. UI hiding is convenience, not security: the RLS DELETE policy
  // ("messages: admin delete any", 0010) rejects the call for anyone who isn't admin.
  const showDelete = isAdmin && !!onDelete

  function handleDelete() {
    const label = message.parent_message_id ? 'this reply' : 'this message and any replies'
    if (window.confirm(`Delete ${label}? This can't be undone.`)) {
      onDelete?.(message.id)
    }
  }

  return (
    <div className="message">
      <div className="message-head">
        <span className="message-author">{message.author_name}</span>
        <span className="message-time">{formatTime(message.created_at)}</span>
        {showDelete && (
          <button
            type="button"
            className="message-delete"
            onClick={handleDelete}
            title="Delete message (admin)"
            aria-label="Delete message"
          >
            Delete
          </button>
        )}
      </div>
      <div className="message-body">{message.body}</div>
      <ReactionBar
        summaries={summaries}
        onToggle={(emoji, mine) => onToggleReaction(message.id, emoji, mine)}
        readOnly={readOnly}
      />
      {showThreadLink && (
        <button type="button" className="thread-link" onClick={onOpenThread}>
          {replyCount
            ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
            : 'Reply in thread'}
        </button>
      )}
    </div>
  )
}
