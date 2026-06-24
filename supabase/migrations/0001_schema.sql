-- CommunityChat v1 — core schema (U3)
-- Single server, multi-server-ready: every domain table carries server_id (KTD-1).
-- Threads via self-referential messages.parent_message_id (KTD-2).
-- RLS is added in 0002_rls.sql; this file only defines tables, keys, indexes, and
-- the new-user trigger that provisions a profile + server membership.

-- profiles: one row per auth user. id mirrors auth.users.id.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now()
);

-- servers: v1 seeds exactly one row (see 0004_seed.sql). No client insert path.
create table if not exists public.servers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- server_members: membership is the visibility boundary (RLS keys off this).
create table if not exists public.server_members (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  server_id uuid not null references public.servers (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (user_id, server_id)
);

-- channels: seeded fixed set per server, ordered by position.
create table if not exists public.channels (
  id        uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers (id) on delete cascade,
  slug      text not null,
  name      text not null,
  position  int  not null default 0,
  unique (server_id, slug)
);

-- messages: text only (KTD-7: no edit/delete in v1). A top-level message has
-- parent_message_id = NULL; a thread reply points at its parent.
create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  channel_id        uuid not null references public.channels (id) on delete cascade,
  user_id           uuid not null references public.profiles (id) on delete cascade,
  parent_message_id uuid references public.messages (id) on delete cascade,
  body              text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at        timestamptz not null default now()
);

-- Read paths: a channel's messages newest-last, and a thread's replies.
create index if not exists messages_channel_created_idx
  on public.messages (channel_id, created_at);
create index if not exists messages_parent_idx
  on public.messages (parent_message_id);

-- On signup: create the profile (display_name defaults to the email local-part)
-- and auto-join every existing server. v1 has one server, so this joins it.
-- SECURITY DEFINER so it can write past RLS; search_path = '' forces full qualification.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));

  insert into public.server_members (user_id, server_id)
  select new.id, s.id from public.servers s;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
