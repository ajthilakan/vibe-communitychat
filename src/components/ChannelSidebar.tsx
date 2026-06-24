import type { Channel } from '../types'

// Channel list, ordered by position. Selecting a channel sets the active channel
// in AppShell. #welcome is the default selection on first load (handled upstream).
export function ChannelSidebar({
  channels,
  activeId,
  onSelect,
}: {
  channels: Channel[]
  activeId: string | null
  onSelect: (channel: Channel) => void
}) {
  return (
    <nav className="sidebar" aria-label="Channels">
      <div className="sidebar-heading">Channels</div>
      <ul>
        {channels.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`channel-item${c.id === activeId ? ' active' : ''}`}
              onClick={() => onSelect(c)}
              aria-current={c.id === activeId}
            >
              <span className="channel-hash">#</span>
              {c.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
