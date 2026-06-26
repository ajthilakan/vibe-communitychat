import type { NotificationItem } from '../types'
import { formatNotification } from '../lib/notificationUtils'

// Compact "time ago" for the notification list (e.g. "5m", "2h", "3d"). Falls back
// to a short date past a week. Display-only, so it lives with the component.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Dropdown inbox of replies to your threads and reactions to your messages (0012).
// Opened from the header bell; clicking an item navigates to its channel (and
// thread, when applicable). Unread rows are marked read by the parent on open, so
// the panel itself only renders + routes clicks.
export function NotificationsPanel({
  items,
  onSelect,
  onClose,
}: {
  items: NotificationItem[]
  onSelect: (item: NotificationItem) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="notif-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="notif-panel" role="dialog" aria-label="Notifications">
        <div className="notif-head">Notifications</div>
        {items.length === 0 ? (
          <div className="notif-empty">
            Nothing yet. Replies to your threads and reactions to your messages show up here.
          </div>
        ) : (
          <ul className="notif-list">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notif-item${n.read_at === null ? ' unread' : ''}`}
                  onClick={() => onSelect(n)}
                >
                  {n.read_at === null && <span className="notif-dot" aria-hidden="true" />}
                  <span className="notif-text">{formatNotification(n)}</span>
                  <span className="notif-time">{timeAgo(n.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
