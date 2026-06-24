import { REPO_URL, VIBE30_URL } from '../lib/links'

// Small credit footer required by the app house rules: link to this app's own
// repo ("source") and to the vibe30 challenge writeup.
export function Footer() {
  return (
    <footer className="app-footer">
      <a href={REPO_URL} target="_blank" rel="noreferrer">
        source
      </a>
      <span aria-hidden="true"> · </span>
      <a href={VIBE30_URL} target="_blank" rel="noreferrer">
        vibe30 challenge
      </a>
    </footer>
  )
}
