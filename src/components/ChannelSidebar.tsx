import type { Channel } from '../types'
import type { OnlineMember } from '../lib/presenceUtils'

// Channel list, ordered by position. Selecting a channel sets the active channel
// in AppShell. #welcome is the default selection on first load (handled upstream).
// Below the channels, a live "Online" roster from Supabase Realtime presence.
// On mobile the sidebar slides in over the chat (open) and is dismissed via the
// backdrop or after a selection; on desktop it's a static column (CSS).
export function ChannelSidebar({
  channels,
  activeId,
  onSelect,
  online,
  unreadChannelIds,
  open = false,
  onClose,
}: {
  channels: Channel[]
  activeId: string | null
  onSelect: (channel: Channel) => void
  online: OnlineMember[]
  unreadChannelIds?: Set<string>
  open?: boolean
  onClose?: () => void
}) {
  return (
    <>
      {open && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}
      <nav
        id="channel-sidebar"
        className={`sidebar${open ? ' open' : ''}`}
        aria-label="Channels"
      >
        <div className="sidebar-heading">Channels</div>
        <ul>
          {channels.map((c) => {
            // The active channel is never shown unread (you're reading it).
            const unread = c.id !== activeId && !!unreadChannelIds?.has(c.id)
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={`channel-item${c.id === activeId ? ' active' : ''}${unread ? ' unread' : ''}`}
                  onClick={() => onSelect(c)}
                  aria-current={c.id === activeId ? 'page' : undefined}
                >
                  <span className="channel-hash">#</span>
                  {c.name}
                  {unread && <span className="channel-unread-dot" aria-label="unread messages" />}
                </button>
              </li>
            )
          })}
        </ul>

        {online.length > 0 && (
          <div className="sidebar-online">
            <div className="sidebar-heading">Online — {online.length}</div>
            <ul>
              {online.map((m) => (
                <li key={m.userId} className="online-item">
                  <span className="online-dot" aria-hidden="true" />
                  {m.displayName}
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  )
}
