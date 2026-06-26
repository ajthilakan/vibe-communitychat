import type { Message, ReactionSummary } from '../types'
import { MessageItem } from './MessageItem'

// The main channel message stream (top-level messages only — replies live in
// threads). Reaction summaries and reply counts are supplied by the parent so
// this component stays a pure renderer.
export function MessageList({
  messages,
  loading,
  replyCounts,
  summariesFor,
  onToggleReaction,
  onOpenThread,
  readOnly = false,
  isAdmin = false,
  onDelete,
}: {
  messages: Message[]
  loading: boolean
  replyCounts: Record<string, number>
  summariesFor: (messageId: string) => ReactionSummary[]
  onToggleReaction: (messageId: string, emoji: string, mine: boolean) => void
  onOpenThread: (messageId: string) => void
  readOnly?: boolean
  isAdmin?: boolean
  onDelete?: (messageId: string) => void
}) {
  if (loading) {
    return <div className="message-list empty">Loading messages…</div>
  }
  if (messages.length === 0) {
    return (
      <div className="message-list empty">
        No messages yet. Be the first to say something.
      </div>
    )
  }

  return (
    <div className="message-list">
      {messages.map((m) => (
        <MessageItem
          key={m.id}
          message={m}
          summaries={summariesFor(m.id)}
          onToggleReaction={onToggleReaction}
          replyCount={replyCounts[m.id]}
          onOpenThread={() => onOpenThread(m.id)}
          readOnly={readOnly}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
