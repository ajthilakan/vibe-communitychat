# KILL-SWITCH — CommunityChat

If CommunityChat is being abused (spam flood, scraping, cost blowup, or anything
that needs to stop **now**), use this runbook. It is ordered **fastest / most
complete first**.

> **Why taking down the web app is NOT enough.** The browser app ships the
> Supabase **anon key** — that's public by design (RLS is the real boundary). A
> malicious client can keep hitting the Supabase API directly with that key even
> if the Cloudflare Pages site is gone. **The real off-switch is on the Supabase
> side**, not Cloudflare. (KTD-5.)

---

## Tier 1 — Pause the Supabase project (the true kill switch)

Stops **all** backend access: API, Auth, Realtime, database. Nothing can read or
write, anon key or not.

1. Supabase dashboard → select project **`axotgmkyfffazntrbjio`** (ajthilakan's Project).
2. **Project Settings → General → Pause project** (alternatively the **Pause**
   control on the project home).
3. Confirm. The project goes offline within seconds.

To resume: **Restore / Resume project** from the same place. No data is lost by
pausing.

---

## Tier 2 — Surgical stops (project stays up)

Use these to stop the bleeding without taking everyone offline.

### 2a. Disable new signups (stop the inflow of new abusers)
- Dashboard → **Authentication → Sign In / Providers** → turn **"Allow new users
  to sign up" OFF**.
- Existing users keep working; no new accounts can be created.

### 2b. Deny-all on the hot table (stop a message/reaction flood)
Run in **Dashboard → SQL Editor**. RLS is already on; a restrictive policy that
matches nothing blocks all client writes while leaving reads intact:

```sql
-- Block ALL message inserts immediately (members can still read history).
create policy "freeze: block all message inserts"
  on public.messages for insert
  to authenticated
  with check (false);
```

To lift it later:

```sql
drop policy "freeze: block all message inserts" on public.messages;
```

The same pattern works for `public.reactions`. (Adjust the rate-limit thresholds
in `supabase/migrations/0003_rate_limit.sql` if the issue is sustained-but-legal
load rather than outright abuse.)

### 2c. Revoke the anon key (rotate)
- Dashboard → **Project Settings → API → rotate the anon/publishable key.**
- This invalidates the key in the deployed bundle (and every scraper using it),
  but also breaks the live site until you redeploy with the new key in Cloudflare
  Pages env vars. Use when you suspect the key is being abused directly.

---

## Tier 3 — Take down the web front door

Lowest impact on a determined abuser (see the anon-key note above), but useful
**together with Tier 1/2** to stop casual traffic and make the outage obvious.

- Cloudflare dashboard → **Workers & Pages → `vibe-communitychat`** → either
  **disable the deployment** or pause the project.
- Or push a maintenance build. Note: this does **not** stop direct Supabase API
  access — pair it with Tier 1 or Tier 2b.

---

## After the incident
- Re-enable signups / drop the freeze policy / resume the project as appropriate.
- Review `## Operations` in `README.md` for what to watch and the free-tier
  ceilings that act as the circuit-breaker.
- If the anon key was rotated, redeploy with the new key set in Cloudflare Pages
  env vars (`VITE_SUPABASE_ANON_KEY`).
