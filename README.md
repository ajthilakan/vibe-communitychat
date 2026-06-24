# vibe-starter-react

React template for my [vibe30](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge) apps. **Vite + React + TypeScript**, with CI (lint + typecheck + build + secret-scan) and house rules already wired. Use this for apps with real interactivity or a backend (e.g. Supabase); use the vanilla [`vibe-starter`](https://github.com/ajthilakan/vibe-starter) for static toys/games.

## Use this template

```bash
gh repo create vibe-SLUG --template ajthilakan/vibe-starter-react --public --clone
cd vibe-SLUG
npm install
npm run dev
```

(Or click **"Use this template"** on GitHub.)

## What''s inside

- **Vite + React + TS** scaffold — deploys clean as a static SPA to Cloudflare Pages.
- **`.github/workflows/ci.yml`** — `npm ci` → lint (oxlint) → `npm run build` (typecheck + build) → tests-if-present, plus a **gitleaks** secret scan. Runs on pushes to `main` and on PRs.
- **`.gitignore`** — ignores `node_modules`, `dist`, `.env*` (never commit secrets — the repo is public).
- **`CLAUDE.md`** — house rules for agent runs in this repo (incl. the anon-key-is-public / service-role-is-secret note for backend apps).

## Backend env (Supabase apps)

Frontend reads public config from Vite env vars at build time, e.g. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Set them in Cloudflare Pages project settings (and a local `.env`, gitignored). The anon key is public by design; the service-role key must never be committed or shipped to the client.

## Deploy (Cloudflare Pages)

- **Keeper / want per-PR previews → git-connect from the start** (CF dashboard → connect this repo, Pages tab). A git-connected project can also be wrangler-deployed; a direct-upload project cannot be converted to git-connected later.
- **Pure throwaway → direct upload:** `npm run build && npx wrangler pages deploy ./dist --project-name=vibe-SLUG`.

See `Setup - vibe30 app pipeline` in the vault for the full per-tier workflow.

---

<!-- Each app spun from this template should replace the section below. -->

## Vibe app NN — APPNAME

- One-line description.
- Link to live app (if available)
- Part of my [vibe30 challenge](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge).
