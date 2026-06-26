// Shown when a magic-link click failed (expired/used link). The message is
// derived from the URL hash by authErrorFromUrl (see ./authError).
export function AuthCallback({ message }: { message: string }) {
  function reset() {
    // Drop the error hash and return to the sign-in form.
    window.location.hash = ''
    window.location.reload()
  }

  return (
    <div className="auth-card">
      <h1>Sign-in link problem</h1>
      <p className="auth-error">{message}</p>
      <button type="button" onClick={reset}>
        Request a new link
      </button>
    </div>
  )
}
