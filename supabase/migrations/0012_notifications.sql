-- CommunityChat — notifications (thread replies + reactions to your messages)
-- Powers the notifications panel FR. Rows are created ONLY by the two
-- SECURITY DEFINER triggers below — there is no client INSERT policy, so a
-- client holding the anon key cannot forge notifications for anyone. Each row is
-- addressed to a recipient (user_id) and records who triggered it (actor_id),
-- what kind, and where to navigate (channel_id + optional thread_root_id).

create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade, -- recipient
  actor_id       uuid not null references public.profiles (id) on delete cascade, -- who caused it
  type           text not null check (type in ('thread_reply', 'reaction')),
  channel_id     uuid not null references public.channels (id) on delete cascade,
  message_id     uuid not null references public.messages (id) on delete cascade, -- subject message
  thread_root_id uuid references public.messages (id) on delete set null,         -- thread to open, if any
  emoji          text,                                                            -- set for 'reaction'
  created_at     timestamptz not null default now(),
  read_at        timestamptz                                                      -- null = unread
);

-- Inbox read path: a user's notifications newest-first, with unread filtering.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Recipient-only. Read your own; mark your own read (update); clear your own
-- (delete). No INSERT policy on purpose: only the definer triggers write rows.
create policy "notifications: select own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications: update own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: delete own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- Trigger 1: a thread reply notifies the parent message's author. Skip
-- self-replies. thread_root_id = the parent (threads are one level, so the
-- parent is always the root) — clicking the notification opens that thread.
create or replace function public.notify_thread_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_author uuid;
begin
  if new.parent_message_id is null then
    return new;
  end if;

  select user_id into parent_author
  from public.messages
  where id = new.parent_message_id;

  if parent_author is not null and parent_author <> new.user_id then
    insert into public.notifications
      (user_id, actor_id, type, channel_id, message_id, thread_root_id)
    values
      (parent_author, new.user_id, 'thread_reply', new.channel_id, new.id, new.parent_message_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_message_notify_reply on public.messages;
create trigger on_message_notify_reply
  after insert on public.messages
  for each row execute function public.notify_thread_reply();

-- Trigger 2: a reaction notifies the reacted-to message's author. Skip reacting
-- to your own message. thread_root_id = the message's parent (so reacting to a
-- thread reply opens that thread; reacting to a top-level message leaves it null
-- and the click just lands in the channel). Guard against re-toggle spam: don't
-- create a second UNREAD reaction notification for the same actor+message+emoji.
create or replace function public.notify_reaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  msg_author  uuid;
  msg_channel uuid;
  msg_parent  uuid;
begin
  select user_id, channel_id, parent_message_id
    into msg_author, msg_channel, msg_parent
  from public.messages
  where id = new.message_id;

  if msg_author is null or msg_author = new.user_id then
    return new;
  end if;

  if exists (
    select 1 from public.notifications n
    where n.user_id = msg_author
      and n.actor_id = new.user_id
      and n.message_id = new.message_id
      and n.type = 'reaction'
      and n.emoji = new.emoji
      and n.read_at is null
  ) then
    return new;
  end if;

  insert into public.notifications
    (user_id, actor_id, type, channel_id, message_id, thread_root_id, emoji)
  values
    (msg_author, new.user_id, 'reaction', msg_channel, new.message_id, msg_parent, new.emoji);

  return new;
end;
$$;

drop trigger if exists on_reaction_notify on public.reactions;
create trigger on_reaction_notify
  after insert on public.reactions
  for each row execute function public.notify_reaction();

-- Realtime: recipients subscribe (filtered to user_id = their uid) to get new
-- notifications live. INSERT is all we stream; marking read is a local/DB update
-- that doesn't need an echo. Default replica identity is enough for INSERT.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
