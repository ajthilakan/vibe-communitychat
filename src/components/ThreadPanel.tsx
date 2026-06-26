import type { Message, ReactionSummary } from '../types'
import { MessageItem } from './MessageItem'
import { MessageComposer } from './MessageComposer'
import { LoginCta } from './LoginCta'

// Slack-style thread panel (U11): the parent message, its replies, and a composer
// scoped to the parent. Replies arrive live through the channel's realtime
// subscription, so a reply posted elsewhere shows up here without a refresh.
export function ThreadPanel({
  parent,
  replies,
  channelId,
  summariesFor,
  onToggleReaction,
  onClose,
  readOnly = false,
  onRequestLogin,
  isAdmin = false,
  onDelete,
}: {
  parent: Message
  replies: Message[]
  channelId: string
  summariesFor: (messageId: string) => ReactionSummary[]
  onToggleReaction: (messageId: string, emoji: string, mine: boolean) => void
  onClose: () => void
  readOnly?: boolean
  onRequestLogin?: () => void
  isAdmin?: boolean
  onDelete?: (messageId: string) => void
}) {
  return (
    <aside className="thread-panel" aria-label="Thread">
      <div className="thread-head">
        <span>Thread</span>
        <button type="button" className="link-button" onClick={onClose} aria-label="Close thread">
          ✕
        </button>
      </div>

      <div className="thread-parent">
        <MessageItem
          message={parent}
          summaries={summariesFor(parent.id)}
          onToggleReaction={onToggleReaction}
          readOnly={readOnly}
          isAdmin={isAdmin}
          onDelete={onDelete}
        />
      </div>

      <div className="thread-replies">
        {replies.length === 0 ? (
          <div className="message-list empty">No replies yet.</div>
        ) : (
          replies.map((r) => (
            <MessageItem
              key={r.id}
              message={r}
              summaries={summariesFor(r.id)}
              onToggleReaction={onToggleReaction}
              readOnly={readOnly}
              isAdmin={isAdmin}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {readOnly ? (
        <LoginCta onLogin={onRequestLogin ?? (() => {})} />
      ) : (
        <MessageComposer
          channelId={channelId}
          parentId={parent.id}
          placeholder="Reply…"
        />
      )}
    </aside>
  )
}
