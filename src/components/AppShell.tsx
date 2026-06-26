import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { useChannels } from '../hooks/useChannels'
import { ChannelSidebar } from './ChannelSidebar'
import { ChannelView } from './ChannelView'
import { Footer } from './Footer'
import { ProfileDialog } from './ProfileDialog'

// Authenticated layout: server title + identity/sign-out, channel sidebar, and the
// active channel. Defaults to #welcome on first load (U8/U12). The identity button
// in the header opens the profile editor; new users who haven't picked a display
// name yet get a one-time prompt.
export function AppShell() {
  const { user, profile, signOut } = useAuth()
  const { channels, loading } = useChannels()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [promptDismissed, setPromptDismissed] = useState(false)

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">CommunityChat</div>
        <div className="app-user">
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

      {(editingProfile || showPrompt) && (
        <ProfileDialog
          firstTime={showPrompt && !editingProfile}
          onClose={() => {
            setEditingProfile(false)
            setPromptDismissed(true)
          }}
        />
      )}
    </div>
  )
}
