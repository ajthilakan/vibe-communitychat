import { useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/useAuth'

// Posts a text message. parentId set => the message is a thread reply (U11).
// Empty/whitespace bodies are blocked client-side; the DB rate-limit trigger (U5)
// surfaces here as an inline error. The new message arrives via the channel's
// realtime subscription, so we don't append it locally.
export function MessageComposer({
  channelId,
  parentId = null,
  placeholder,
}: {
  channelId: string
  parentId?: string | null
  placeholder?: string
}) {
  const { user } = useAuth()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    const trimmed = body.trim()
    if (trimmed.length === 0 || !user) return
    setSending(true)
    setError('')
    const { error: insertError } = await supabase.from('messages').insert({
      channel_id: channelId,
      user_id: user.id,
      parent_message_id: parentId,
      body: trimmed,
    })
    setSending(false)
    if (insertError) {
      setError(insertError.message)
    } else {
      setBody('')
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder ?? 'Write a message…'}
        rows={1}
        aria-label="Message"
      />
      <button type="submit" disabled={sending || body.trim().length === 0}>
        Send
      </button>
      {error && <p className="composer-error">{error}</p>}
    </form>
  )
}
