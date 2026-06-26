// Read-only CTA shown in place of the message composer for logged-out visitors.
// Clicking opens the existing magic-link form (AppShell owns that toggle).
export function LoginCta({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="login-cta">
      <span>Log in to start messaging</span>
      <button type="button" onClick={onLogin}>
        Log in
      </button>
    </div>
  )
}
