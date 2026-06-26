import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useChannels } from '../hooks/useChannels'
import { usePresence } from '../hooks/usePresence'
import { useUnread } from '../hooks/useUnread'
import { useNotifications } from '../hooks/useNotifications'
import { MagicLinkForm } from '../auth/MagicLinkForm'
import { ChannelSidebar } from './ChannelSidebar'
import { ChannelView } from './ChannelView'
import { Footer } from './Footer'
import { NotificationsPanel } from './NotificationsPanel'
import { ProfileDialog } from './ProfileDialog'
import { UsersPanel } from './UsersPanel'
import type { NotificationItem } from '../types'

// App layout for both states. Authenticated: server title + identity/sign-out (the
// identity button opens the profile editor; new users who haven't picked a display
// name yet get a one-time prompt) and full compose. Logged-out (read-only): a "Log in"
// button in the header and an in-place CTA in place of the composer; the magic-link
// form is reachable but not forced (U15). Defaults to #welcome on first load (U8/U12).
export function AppShell() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const { channels, loading } = useChannels()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  // Mobile-only: the channel sidebar is hidden behind a hamburger toggle. On
  // desktop the sidebar is always visible (CSS), so this flag is a no-op there.
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  // A thread to auto-open after a notification click. focusToken bumps on every
  // click so re-opening the same thread (already in-channel) re-triggers.
  const [focus, setFocus] = useState<{ channelId: string; threadId: string | null; token: number }>(
    { channelId: '', threadId: null, token: 0 },
  )

  const readOnly = !user

  // Unread channel/thread tracking + the notifications inbox (both authenticated-only).
  const unread = useUnread(user?.id, activeId)
  const notifications = useNotifications(user?.id)

  function openNotifications() {
    setShowNotifications(true)
    void notifications.markAllRead()
  }

  function handleSelectNotification(n: NotificationItem) {
    setActiveId(n.channel_id)
    setFocus((f) => ({ channelId: n.channel_id, threadId: n.thread_root_id, token: f.token + 1 }))
    setShowNotifications(false)
  }

  useEffect(() => {
    if (!activeId && channels.length > 0) {
      const welcome = channels.find((c) => c.slug === 'welcome')
      setActiveId((welcome ?? channels[0]).id)
    }
  }, [channels, activeId])

  const active = channels.find((c) => c.id === activeId) ?? null

  // First-entry nudge: prompt once, after the profile loads, until the user saves
  // a name (display_name_set flips true) or dismisses it for this session.
  const showPrompt = !!profile && !profile.display_name_set && !promptDismissed
  const identity = profile?.display_name ?? user?.email ?? 'You'

  // Who's online, server-wide. One presence channel for the (single) server; we
  // announce only a display_name (never email). Anon visitors observe but don't appear.
  const serverId = channels[0]?.server_id ?? null
  const online = usePresence(serverId, user?.id, profile?.display_name ?? 'Someone')

  // Logged-out visitor chose to log in: show the magic-link form, with a way back
  // to keep browsing read-only.
  if (readOnly && showLogin) {
    return (
      <div className="auth-screen">
        <div>
          <MagicLinkForm />
          <p className="auth-back">
            <button type="button" className="link-button" onClick={() => setShowLogin(false)}>
              ← Back to browsing
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <button
            type="button"
            className="sidebar-toggle"
            aria-label="Toggle channel list"
            aria-expanded={sidebarOpen}
            aria-controls="channel-sidebar"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            ☰
          </button>
          <div className="app-title">CommunityChat</div>
        </div>
        <div className="app-user">
          {readOnly ? (
            <button type="button" className="header-login" onClick={() => setShowLogin(true)}>
              Log in
            </button>
          ) : (
            <>
              {isAdmin && (
                <button type="button" className="link-button" onClick={() => setShowUsers(true)}>
                  Users
                </button>
              )}
              <button
                type="button"
                className="notif-bell"
                onClick={openNotifications}
                aria-label={
                  notifications.unreadCount > 0
                    ? `Notifications (${notifications.unreadCount} unread)`
                    : 'Notifications'
                }
                title="Notifications"
              >
                🔔
                {notifications.unreadCount > 0 && (
                  <span className="notif-badge">
                    {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="app-identity"
                onClick={() => setEditingProfile(true)}
                title="Edit your display name"
              >
                {identity}
              </button>
              <button type="button" className="link-button" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        <ChannelSidebar
          channels={channels}
          activeId={activeId}
          online={online}
          unreadChannelIds={unread.unreadChannelIds}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={(c) => {
            setActiveId(c.id)
            setSidebarOpen(false) // close the overlay after picking on mobile
          }}
        />
        <main className="app-content">
          {loading ? (
            <div className="message-list empty">Loading channels…</div>
          ) : active ? (
            <ChannelView
              key={active.id}
              channel={active}
              readOnly={readOnly}
              onRequestLogin={() => setShowLogin(true)}
              unreadBaseline={unread.baselineFor(active.id)}
              focusThreadId={focus.channelId === active.id ? focus.threadId : null}
              focusToken={focus.channelId === active.id ? focus.token : 0}
            />
          ) : (
            <div className="message-list empty">No channels available.</div>
          )}
        </main>
      </div>

      <Footer />

      {(editingProfile || showPrompt) && (
        <ProfileDialog
          firstTime={showPrompt && !editingProfile}
          onClose={() => {
            setEditingProfile(false)
            setPromptDismissed(true)
          }}
        />
      )}

      {!readOnly && showNotifications && (
        <NotificationsPanel
          items={notifications.items}
          onSelect={handleSelectNotification}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {isAdmin && showUsers && user && (
        <UsersPanel currentUserId={user.id} onClose={() => setShowUsers(false)} />
      )}
    </div>
  )
}
