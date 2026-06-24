# vibe-communitychat — CommunityChat

A single-server, Slack/Discord-style chat app — the next build for my [vibe30 challenge](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge). I built it to **test a real-time messaging app on the popular [Supabase](https://supabase.com) backend**, and to take on a more complex, full-stack application as my next vibe-coding challenge. Spun from [`vibe-starter-react`](https://github.com/ajthilakan/vibe-starter-react).

**v1:** magic-link sign-in (passwordless), seeded channels, text messages, Slack-style threads, and emoji reactions — all updating **live**. _Status: in active build._

## Stack

- **Frontend:** Vite + React + TypeScript SPA, deployed to Cloudflare Pages.
- **Backend:** [Supabase](https://supabase.com) — Auth (magic link), Postgres with Row-Level Security on every table, and Realtime for live messages + reactions.

## Dev

```bash
npm install
cp .env.example .env   # then fill in your Supabase project URL + anon key
npm run dev      # local dev server
npm run build    # typecheck + production build to dist/
npm run preview  # serve the built dist/
```

### Environment

Set these in a local `.env` (gitignored) and in the Cloudflare Pages project settings:

- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — the anon / publishable key. **Public by design** (it ships in the browser bundle); Row-Level Security, not key secrecy, protects the data.

The Supabase **service-role / secret key is never** committed or shipped to the client.

---

- Single-server Discord/Slack-style chat — magic-link auth, channels, threads, live messages, reactions.
- Live: https://vibe-communitychat.pages.dev
- My first vibe app with a real backend — a more complex full-stack build (React + Supabase).
- Part of my [vibe30 challenge](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge).
