import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useChannels } from '../hooks/useChannels'
import { ChannelSidebar } from './ChannelSidebar'
import { ChannelView } from './ChannelView'
import { Footer } from './Footer'

// Authenticated layout: server title + sign-out, channel sidebar, and the active
// channel. Defaults to #welcome on first load (U8/U12).
export function AppShell() {
  const { user, signOut } = useAuth()
  const { channels, loading } = useChannels()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeId && channels.length > 0) {
      const welcome = channels.find((c) => c.slug === 'welcome')
      setActiveId((welcome ?? channels[0]).id)
    }
  }, [channels, activeId])

  const active = channels.find((c) => c.id === activeId) ?? null

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">CommunityChat</div>
        <div className="app-user">
          <span className="app-email">{user?.email}</span>
          <button type="button" className="link-button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <div className="app-body">
        <ChannelSidebar
          channels={channels}
          activeId={activeId}
          onSelect={(c) => setActiveId(c.id)}
        />
        <main className="app-content">
          {loading ? (
            <div className="message-list empty">Loading channels…</div>
          ) : active ? (
            <ChannelView key={active.id} channel={active} />
          ) : (
            <div className="message-list empty">No channels available.</div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
