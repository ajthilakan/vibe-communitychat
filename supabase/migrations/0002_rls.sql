-- CommunityChat v1 — Row Level Security (U4)
-- RLS is the real data boundary (KTD): a client holding the public anon key can only
-- read/write rows its server membership allows. Enable RLS on every table, then add
-- least-privilege policies. Membership in server_members is the pivot for visibility.

alter table public.profiles       enable row level security;
alter table public.servers        enable row level security;
alter table public.server_members enable row level security;
alter table public.channels       enable row level security;
alter table public.messages       enable row level security;

-- Helper: is the current user a member of this server? SECURITY DEFINER so the
-- membership lookup itself isn't subject to server_members RLS (avoids recursion).
create or replace function public.is_server_member(target_server uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.server_members m
    where m.server_id = target_server and m.user_id = auth.uid()
  );
$$;

-- profiles ------------------------------------------------------------------
-- Any authenticated user can read profiles (needed to render author names).
-- A user may insert/update only their own row. The signup trigger (SECURITY
-- DEFINER) creates the initial row, so normal inserts are rare but allowed.
create policy "profiles: read for authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- servers -------------------------------------------------------------------
-- Read only servers you belong to. No client insert/update/delete (seeded).
create policy "servers: read if member"
  on public.servers for select
  to authenticated
  using (public.is_server_member(id));

-- channels ------------------------------------------------------------------
-- Read channels of servers you belong to. No client writes (seeded).
create policy "channels: read if member"
  on public.channels for select
  to authenticated
  using (public.is_server_member(server_id));

-- server_members ------------------------------------------------------------
-- See membership rows for servers you belong to (renders member lists later).
-- Insert only your own membership. The signup trigger handles the common case.
create policy "server_members: read if member"
  on public.server_members for select
  to authenticated
  using (public.is_server_member(server_id));

create policy "server_members: insert own"
  on public.server_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- Helper: is `parent` a valid thread parent for a reply in channel `chan`?
-- It must be a top-level message (parent_message_id IS NULL) living in the SAME
-- channel. This blocks cross-channel/cross-thread reply smuggling (a reply whose
-- channel_id differs from its parent's) and enforces one-level Slack-style threads.
-- Named params avoid the correlated-subquery ambiguity an inline policy would hit.
create or replace function public.is_valid_thread_parent(parent uuid, chan uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.messages p
    where p.id = parent
      and p.channel_id = chan
      and p.parent_message_id is null
  );
$$;

-- messages ------------------------------------------------------------------
-- Read messages in channels of servers you belong to. Insert only as yourself
-- and only into a channel whose server you belong to. No update/delete (KTD-7).
create policy "messages: read if member"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.channels c
      where c.id = channel_id and public.is_server_member(c.server_id)
    )
  );

create policy "messages: insert own in member channel"
  on public.messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.channels c
      where c.id = channel_id and public.is_server_member(c.server_id)
    )
    and (
      parent_message_id is null
      or public.is_valid_thread_parent(parent_message_id, channel_id)
    )
  );
