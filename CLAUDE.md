# CLAUDE.md — vibe30 app (React)

House rules for any agent working in a repo spun from `vibe-starter-react`. These are the defaults; the human owner (Ajith) can override per app.

## The repo is PUBLIC
- **Never commit secrets** — API tokens, keys, passwords. They live in GitHub/Cloudflare settings panels, never in the repo or a committed `.env`. The `.gitignore` excludes `.env*`; CI runs a gitleaks scan as a backstop. If a secret ever lands in history, tell Ajith to revoke it immediately.
- A Supabase/backend **anon/publishable key is public by design** (it ships in the browser bundle) and may be set as a build-time env var — that is expected and is NOT a leaked secret. The **service-role key must never** appear in client code or the repo. Row-Level Security, not key secrecy, protects the data.

## Branch + merge discipline
- **Push branches and open PRs. Do NOT merge to `main` yourself** unless Ajith has explicitly turned on agent-merge for this repo.
- When agent-merge IS enabled, merge only when CI is green, code review is clean, and browser tests pass — e.g. `gh pr merge --squash --auto` (so GitHub holds the merge until required checks pass). Never weaken or skip a check to make it pass.
- Tier A (disposable) apps may work directly on `main` — Ajith will say if so.

## Build + deploy
- `npm run build` produces `dist/` (`tsc -b && vite build` = typecheck + build). Build before any deploy.
- `npm run lint` runs oxlint. CI (`.github/workflows/ci.yml`) must stay green: lint + typecheck + build + secret-scan.
- Deploy via the method this app was set up with: **git-connect** (push/merge triggers the Cloudflare Pages build) or **wrangler direct-upload** (`npx wrangler pages deploy ./dist --project-name=<this-repo>`).
- Don't change the deploy method without asking — converting direct-upload → git-connect requires recreating the Pages project.

## Quality
- Keep it simple; match the existing code style. Prefer a few well-named components/hooks over premature abstraction.

## App page conventions
- Include a small **footer / credit** in the app UI that links to **this app's own GitHub repo** (`https://github.com/ajthilakan/<this-repo>`, shown as "source") and to the [vibe30 challenge](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge). Link to the repo, not the personal site — each app page points at its own source.
- If the build re-does someone else's project, credit them in the README.
