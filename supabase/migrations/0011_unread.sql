-- CommunityChat — unread tracking (channel-level read pointers)
-- Drives the "highlight channels/threads with unread messages" FR. One read
-- pointer per (user, channel): last_read_at. A channel is "unread" when it holds
-- a message newer than the user's pointer that the user didn't write themselves.
-- Thread highlighting reuses the same pointer client-side (channel-level model,
-- v1) — no per-thread state. RLS keeps each user to their own pointers; this
-- table is never realtime-published (unread is derived from the existing
-- messages realtime stream, 0006, plus this pointer loaded once per session).

create table if not exists public.channel_reads (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  channel_id   uuid not null references public.channels (id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

alter table public.channel_reads enable row level security;

-- Own rows only. Insert + update are both needed so the client can upsert
-- (on conflict (user_id, channel_id)) when it marks a channel read. No delete
-- policy — cleanup rides the ON DELETE CASCADE from profiles/channels.
create policy "channel_reads: select own"
  on public.channel_reads for select
  to authenticated
  using (user_id = auth.uid());

create policy "channel_reads: insert own"
  on public.channel_reads for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "channel_reads: update own"
  on public.channel_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Latest non-own activity per channel the caller can see. SECURITY INVOKER so
-- the existing messages/channels RLS still scopes the rows (the caller only sees
-- channels of servers they belong to). Excluding the caller's own messages means
-- posting in a channel never marks it unread to yourself. The client compares
-- each latest_at against its channel_reads pointer to decide the highlight.
create or replace function public.channel_unread_state()
returns table (channel_id uuid, latest_at timestamptz)
language sql
security invoker
set search_path = ''
stable
as $$
  select m.channel_id, max(m.created_at) as latest_at
  from public.messages m
  where m.user_id <> auth.uid()
  group by m.channel_id;
$$;
