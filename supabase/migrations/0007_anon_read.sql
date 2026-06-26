-- CommunityChat v1 — anonymous read-only access (U15)
-- Goal: let logged-out (anon) visitors BROWSE the public community — read channels,
-- messages, threads, reactions, and author display names — without an account. They
-- still cannot write anything (no insert/update/delete policies for anon anywhere).
--
-- SCOPE IS DELIBERATELY NARROW. Every anon policy is pinned to the single public seed
-- server '11111111-1111-1111-1111-111111111111' (see 0004_seed.sql). No other server,
-- and crucially NOT server_members, is exposed to anon. Authenticated behavior from
-- 0002_rls.sql / 0005_reactions.sql is unchanged — these are purely additive SELECT
-- policies for the `anon` role. RLS (not key secrecy) remains the data boundary, and
-- table-level grants for anon come from Supabase's default privileges, same as the
-- existing `authenticated` policies rely on.

-- servers -------------------------------------------------------------------
-- Anon may see only the public server row (renders the title). Not other servers.
create policy "servers: anon read public server"
  on public.servers for select
  to anon
  using (id = '11111111-1111-1111-1111-111111111111');

-- channels ------------------------------------------------------------------
-- Anon may list the public server's channels (the sidebar). No writes.
create policy "channels: anon read public server"
  on public.channels for select
  to anon
  using (server_id = '11111111-1111-1111-1111-111111111111');

-- messages ------------------------------------------------------------------
-- Anon may read messages (top-level + thread replies) in the public server's
-- channels. No insert policy for anon => posting stays impossible for logged-out
-- visitors. Realtime INSERTs flow to anon because postgres_changes honours this
-- SELECT policy.
create policy "messages: anon read public server"
  on public.messages for select
  to anon
  using (
    exists (
      select 1 from public.channels c
      where c.id = channel_id
        and c.server_id = '11111111-1111-1111-1111-111111111111'
    )
  );

-- reactions -----------------------------------------------------------------
-- Anon may read reaction rows on those messages (counts/emoji). No insert/delete
-- for anon => reacting stays impossible for logged-out visitors.
create policy "reactions: anon read public server"
  on public.reactions for select
  to anon
  using (
    exists (
      select 1
      from public.messages m
      join public.channels c on c.id = m.channel_id
      where m.id = message_id
        and c.server_id = '11111111-1111-1111-1111-111111111111'
    )
  );

-- profiles ------------------------------------------------------------------
-- Anon needs author display_name to label messages (PostgREST embeds profiles,
-- and the realtime path looks one up by id). Expose ONLY profiles that authored a
-- message in the public server — not the full profiles table. A profiles row holds
-- just id, display_name, created_at (no email), so this leaks nothing beyond the
-- already-public chat author name.
create policy "profiles: anon read public-server authors"
  on public.profiles for select
  to anon
  using (
    exists (
      select 1
      from public.messages m
      join public.channels c on c.id = m.channel_id
      where m.user_id = id
        and c.server_id = '11111111-1111-1111-1111-111111111111'
    )
  );
