import { useAuth } from './auth/useAuth'
import { MagicLinkForm } from './auth/MagicLinkForm'
import { AuthCallback } from './auth/AuthCallback'
import { authErrorFromUrl } from './auth/authError'
import { AppShell } from './components/AppShell'
import './App.css'

// Auth gate: no session => magic-link screen (or a clear error if a stale link
// brought the user back); session => the chat app.
function App() {
  const { session, loading } = useAuth()
  const urlError = authErrorFromUrl()

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="auth-screen">
        {urlError ? <AuthCallback message={urlError} /> : <MagicLinkForm />}
      </div>
    )
  }

  return <AppShell />
}

export default App
