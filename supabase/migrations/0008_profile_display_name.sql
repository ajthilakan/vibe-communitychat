-- CommunityChat — editable display names + first-entry prompt support
-- Today display_name defaults to the email local-part at signup (0001 trigger) and
-- there is no way to change it. This migration lets a user replace that with a real
-- name, and adds a flag so the client can prompt first-time users once.
--
-- Privacy: email is NOT stored in public.profiles — it lives in auth.users and is
-- never sent to the client — so nothing here exposes email. display_name stays
-- readable by all authenticated members (message author attribution depends on it),
-- so this migration deliberately does NOT change profiles SELECT, and adds nothing
-- readable by anon (profiles has no anon policies).

-- 1) Track whether the user has chosen a name vs. still on the signup default.
--    Existing rows default to false → they get prompted once, which is acceptable.
alter table public.profiles
  add column if not exists display_name_set boolean not null default false;

-- 2) Sanity-bound display_name: trimmed, 1–40 chars. Added NOT VALID so applying
--    this migration never fails on a pre-existing email-derived name that happens
--    to exceed 40 chars; the constraint is still enforced on every future
--    INSERT/UPDATE, which is what the edit flow needs.
alter table public.profiles
  drop constraint if exists profiles_display_name_len;
alter table public.profiles
  add constraint profiles_display_name_len
  check (char_length(btrim(display_name)) between 1 and 40) not valid;

-- 3) Let a user UPDATE only their own profile row. 0002_rls.sql already defines
--    this exact policy; re-assert it idempotently so this migration is
--    self-contained and the new column is writable by its owner (and only its owner).
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
