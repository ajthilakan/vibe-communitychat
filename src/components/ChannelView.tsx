import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Channel } from '../types'
import { useAuth } from '../auth/useAuth'
import { useChannelMessages } from '../hooks/useChannelMessages'
import { useChannelReactions } from '../hooks/useChannelReactions'
import { useTyping } from '../hooks/useTyping'
import { aggregateReactions } from '../lib/reactionUtils'
import { replyCounts } from '../lib/messageUtils'
import { formatTypingText } from '../lib/typingUtils'
import { unreadThreadParents } from '../lib/unreadUtils'
import { MessageList } from './MessageList'
import { MessageComposer } from './MessageComposer'
import { LoginCta } from './LoginCta'
import { ThreadPanel } from './ThreadPanel'
import { WelcomeBanner } from './WelcomeBanner'

// Active-channel surface: wires the channel's live messages and reactions to the
// list, composer, and (when opened) thread panel. #welcome additionally shows the
// static WelcomeBanner (U12). In read-only mode (logged-out, U15) the composer and
// reaction/reply controls are replaced by a login CTA — reads still work via the
// anon RLS policies (0007_anon_read.sql).
export function ChannelView({
  channel,
  readOnly,
  onRequestLogin,
  unreadBaseline = null,
  focusThreadId = null,
  focusToken = 0,
}: {
  channel: Channel
  readOnly: boolean
  onRequestLogin: () => void
  // The channel's read pointer as of entry, for thread-unread highlighting (null
  // = never visited). Captured once at mount — ChannelView remounts per channel.
  unreadBaseline?: string | null
  // A thread to auto-open (from a notification click); focusToken changes on each
  // click so re-selecting the same thread re-opens it.
  focusThreadId?: string | null
  focusToken?: number
}) {
  const { user, profile, isAdmin } = useAuth()
  const [baseline] = useState<string | null>(() => unreadBaseline)
  const { messages, loading, deleteMessage } = useChannelMessages(channel.id)
  const messageIds = useMemo(() => messages.map((m) => m.id), [messages])
  const { reactions, toggle } = useChannelReactions(channel.id, user?.id, messageIds)
  const { typingNames, notifyTyping, clearUser } = useTyping(
    channel.id,
    user?.id,
    profile?.display_name ?? 'Someone',
  )
  const [threadParentId, setThreadParentId] = useState<string | null>(null)

  // Close any open thread when switching channels.
  useEffect(() => setThreadParentId(null), [channel.id])

  // Open the thread a notification points at. Keyed on focusToken so clicking the
  // same notification again (already in this channel) re-opens it.
  useEffect(() => {
    if (focusThreadId) setThreadParentId(focusThreadId)
  }, [focusToken]) // eslint-disable-line react-hooks/exhaustive-deps

  // A person's own message landing means they've stopped typing — clear them
  // immediately rather than waiting for the idle timeout.
  const lastMessage = messages[messages.length - 1]
  const lastMessageId = lastMessage?.id
  useEffect(() => {
    if (lastMessage) clearUser(lastMessage.user_id)
  }, [lastMessageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const topLevel = useMemo(
    () => messages.filter((m) => m.parent_message_id === null),
    [messages],
  )
  const counts = useMemo(() => replyCounts(messages), [messages])

  // Thread parents with replies newer than this visit's baseline (by someone
  // else) — surfaced as a "new" marker on the reply link until the next visit.
  const unreadThreadIds = useMemo(
    () => unreadThreadParents(messages, baseline, user?.id),
    [messages, baseline, user?.id],
  )

  const summariesFor = useCallback(
    (messageId: string) =>
      aggregateReactions(
        reactions.filter((r) => r.message_id === messageId),
        user?.id,
      ),
    [reactions, user?.id],
  )

  const { threadParent, threadReplies } = useMemo(() => {
    if (!threadParentId) return { threadParent: null, threadReplies: [] }
    return {
      threadParent: messages.find((m) => m.id === threadParentId) ?? null,
      threadReplies: messages.filter((m) => m.parent_message_id === threadParentId),
    }
  }, [messages, threadParentId])

  return (
    <section className="channel-view">
      <header className="channel-header">
        <span className="channel-hash">#</span>
        {channel.name}
      </header>

      <div className="channel-main">
        <div className="channel-stream">
          {/* The banner lives inside the scroll region so it scrolls away with the
              messages instead of pinning to the top (important on mobile, U12). */}
          <div className="channel-scroll">
            {channel.slug === 'welcome' && <WelcomeBanner />}
            <MessageList
              messages={topLevel}
              loading={loading}
              replyCounts={counts}
              summariesFor={summariesFor}
              onToggleReaction={toggle}
              onOpenThread={setThreadParentId}
              unreadThreadIds={unreadThreadIds}
              readOnly={readOnly}
              isAdmin={isAdmin}
              onDelete={deleteMessage}
            />
          </div>
          <div className="typing-indicator" aria-live="polite">
            {formatTypingText(typingNames)}
          </div>
          {readOnly ? (
            <LoginCta onLogin={onRequestLogin} />
          ) : (
            <MessageComposer
              channelId={channel.id}
              placeholder={`Message #${channel.name}`}
              onTyping={notifyTyping}
              autoFocus
            />
          )}
        </div>

        {threadParent && (
          <ThreadPanel
            parent={threadParent}
            replies={threadReplies}
            channelId={channel.id}
            summariesFor={summariesFor}
            onToggleReaction={toggle}
            onClose={() => setThreadParentId(null)}
            readOnly={readOnly}
            onRequestLogin={onRequestLogin}
            isAdmin={isAdmin}
            onDelete={deleteMessage}
          />
        )}
      </div>
    </section>
  )
}
