-- CommunityChat v1 — emoji reactions (U14)
-- Self-contained: table + RLS + realtime. One of each emoji per user per message
-- (unique constraint) so a click toggles insert/delete. RLS mirrors messages:
-- read if a member of the message's server; insert/delete only your own rows.

create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  -- Bound the emoji server-side: the client only sends short emoji from a curated
  -- palette, but a client holding the anon key controls this value directly, and
  -- reactions have no rate-limit trigger — so the cap stops unbounded-write abuse.
  emoji      text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists reactions_message_idx on public.reactions (message_id);

alter table public.reactions enable row level security;

-- Helper: is the current user a member of the server that owns this message?
create or replace function public.can_access_message(target_message uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.messages msg
    join public.channels c on c.id = msg.channel_id
    where msg.id = target_message and public.is_server_member(c.server_id)
  );
$$;

create policy "reactions: read if member"
  on public.reactions for select
  to authenticated
  using (public.can_access_message(message_id));

create policy "reactions: insert own"
  on public.reactions for insert
  to authenticated
  with check (user_id = auth.uid() and public.can_access_message(message_id));

create policy "reactions: delete own"
  on public.reactions for delete
  to authenticated
  using (user_id = auth.uid() and public.can_access_message(message_id));

-- Realtime: deliver INSERT and DELETE events. REPLICA IDENTITY FULL so DELETE
-- payloads carry the removed row (needed to decrement the right emoji/user).
alter table public.reactions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
end $$;
