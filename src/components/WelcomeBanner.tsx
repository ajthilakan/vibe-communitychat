import { REPO_URL } from '../lib/links'

// Static banner shown at the top of #welcome only (U12). Tells new users what
// CommunityChat is, nudges an intro, and links the source repo. #welcome stays a
// normal writable channel, so intros go right below this.
export function WelcomeBanner() {
  return (
    <div className="welcome-banner">
      <h2>👋 Welcome to CommunityChat</h2>
      <p>
        A small, friendly community chat. Here's how to get going:
      </p>
      <ul>
        <li>
          <strong>Introduce yourself</strong> — say hi right here in{' '}
          <code>#welcome</code>.
        </li>
        <li>
          <strong>Find a channel</strong> — jump into{' '}
          <code>#world-cup-2026</code>, <code>#tv-shows</code>,{' '}
          <code>#books</code>, or <code>#games</code> from the sidebar.
        </li>
        <li>
          <strong>Reply in threads</strong> and react with emoji to keep things
          tidy.
        </li>
      </ul>
      <p className="welcome-source">
        CommunityChat is open source —{' '}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          view the code on GitHub
        </a>
        .
      </p>
    </div>
  )
}
