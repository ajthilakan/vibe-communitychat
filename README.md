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

## Database & migrations

The schema, RLS policies, rate-limit trigger, seed data, reactions, and Realtime
config live in `supabase/migrations/` and are applied with the Supabase CLI:

```bash
npx supabase link --project-ref <project-ref>   # one-time
npx supabase db push                            # apply all migrations
```

`db push` needs the database password in `SUPABASE_DB_PASSWORD` (it is **not** the
anon key — find/reset it under **Project Settings → Database**). Migration order:

| File | What it does |
|------|--------------|
| `0001_schema.sql` | Tables (profiles, servers, server_members, channels, messages), indexes, new-user trigger (creates profile + auto-joins the server) |
| `0002_rls.sql` | Row-Level Security + policies on every table — the real data boundary |
| `0003_rate_limit.sql` | `BEFORE INSERT` trigger on messages: rejects floods (>5/10s, >30/60s) |
| `0004_seed.sql` | One server + the 5 channels (`#welcome`, `#world-cup-2026`, `#tv-shows`, `#books`, `#games`) |
| `0005_reactions.sql` | `reactions` table + RLS + adds it to the Realtime publication |
| `0006_realtime.sql` | Adds `messages` to the Realtime publication (no dashboard toggle) |

Realtime is enabled **in SQL** (the `alter publication supabase_realtime …`
statements), not via the dashboard, so the setup is reproducible.

## Operations

**If something is on fire, see [`KILL-SWITCH.md`](./KILL-SWITCH.md).** Short
version: the real off-switch is **pausing the Supabase project** — taking down
Cloudflare alone does not stop direct API access, because the anon key is public.

**What to watch** (Supabase dashboard → **Reports / Usage**):

- **Auth → Users (MAU):** sudden spikes in new signups can signal abuse — the
  Tier-2 lever is turning off "Allow new users to sign up".
- **Database → rows / size:** a fast-growing `messages` or `reactions` table is
  the spam signal; the rate-limit trigger is the first line of defence.
- **Realtime → concurrent connections** and **API/egress:** watch against the
  free-tier ceilings (these are the de-facto circuit-breaker for v1 scale).

When usage approaches free-tier limits or any metric climbs abnormally fast,
treat it as a possible abuse event and consult the kill-switch tiers.

---

- Single-server Discord/Slack-style chat — magic-link auth, channels, threads, live messages, reactions.
- Live: https://vibe-communitychat.pages.dev
- My first vibe app with a real backend — a more complex full-stack build (React + Supabase).
- Part of my [vibe30 challenge](https://ajthilakan.com/posts/quick-update-retooling/#thread-2--vibe-30-or-60-challenge).
