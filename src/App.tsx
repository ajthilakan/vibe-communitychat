import { useAuth } from './auth/useAuth'
import { AuthCallback } from './auth/AuthCallback'
import { authErrorFromUrl } from './auth/authError'
import { AppShell } from './components/AppShell'
import './App.css'

// No auth gate on reads: logged-out visitors get the app in read-only mode
// (AppShell handles anon vs. authenticated). The only full-screen interrupt is a
// failed magic-link return (expired/used link), which still shows the error card.
function App() {
  const { loading } = useAuth()
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

  if (urlError) {
    return (
      <div className="auth-screen">
        <AuthCallback message={urlError} />
      </div>
    )
  }

  return <AppShell />
}

export default App
