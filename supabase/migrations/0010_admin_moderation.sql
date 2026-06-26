-- CommunityChat — single-admin moderation (admin delete + user blocking)
-- Adds a privileged role (one owner) that can delete any message and block users
-- from posting. RLS remains the real data boundary: the admin gate lives in policies
-- and a guard trigger, not in client code. Two new profiles flags drive it:
--   is_admin — set ONLY out-of-band by the owner (see grant note below); never settable
--              through a normal API request, even by an admin (anti-escalation).
--   blocked  — an admin may toggle this on any user; a blocked user cannot INSERT
--              messages (the existing message INSERT predicate is preserved and ANDed).
--
-- IMPORTANT — do NOT hardcode the owner's email in this public repo. After this
-- migration is applied, the owner runs this one line ONCE in the SQL editor to grant
-- themselves admin (it executes without a JWT, so the guard trigger below permits it):
--   update public.profiles set is_admin = true
--     where id = (select id from auth.users where email = 'OWNER_EMAIL_HERE');

-- 1) New flags. Defaults keep every existing row non-admin and unblocked.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;
alter table public.profiles
  add column if not exists blocked boolean not null default false;

-- 2) Helper: is the current user an admin? SECURITY DEFINER + empty search_path,
--    mirroring is_server_member / can_access_message so policies stay readable and the
--    lookup isn't itself subject to profiles RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  );
$$;

-- 3) messages DELETE: only an admin may delete, and they may delete ANY message.
--    Cascade decision: messages.parent_message_id (0001) and reactions.message_id
--    (0005) are both ON DELETE CASCADE, so deleting a top-level message removes its
--    thread replies and all reactions in one statement — no leaf-first UI dance needed.
create policy "messages: admin delete any"
  on public.messages for delete
  to authenticated
  using (public.is_admin());

-- 4) messages INSERT: recreate the existing policy verbatim, ANDing a "not blocked"
--    guard so a blocked user cannot post. Every prior condition is preserved exactly
--    (self-authorship, member channel, valid thread parent) — only the block check is new.
drop policy if exists "messages: insert own in member channel" on public.messages;
create policy "messages: insert own in member channel"
  on public.messages for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.blocked
    )
    and exists (
      select 1 from public.channels c
      where c.id = channel_id and public.is_server_member(c.server_id)
    )
    and (
      parent_message_id is null
      or public.is_valid_thread_parent(parent_message_id, channel_id)
    )
  );

-- 5) profiles UPDATE for admins: lets an admin write OTHER users' rows (to set blocked).
--    This is additive to "profiles: update own" (0002/0008) — that owner-only policy is
--    left untouched, so a normal user's display_name edit still works. The two permissive
--    UPDATE policies are OR'd: a user reaches their own row via "update own"; an admin
--    reaches any row via this one. Column-level safety (which flags may change) is enforced
--    by the guard trigger in step 6, not here.
create policy "profiles: admin update any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6) Escalation guard. RLS WITH CHECK cannot compare OLD vs NEW, so a column-level guard
--    must be a trigger. This is the key anti-privilege-escalation control:
--      * is_admin can NEVER change through a JWT-bearing request — not even an admin's.
--        It is set only by the owner's one-time grant, which runs with no JWT
--        (auth.uid() is null). So no client holding the anon key can self-promote.
--      * blocked may change only when the caller is an admin (this also stops a blocked
--        user from clearing their own blocked flag via "update own").
--    Everything else (e.g. display_name) is unaffected, so existing edits keep working.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    raise exception 'is_admin cannot be changed through the API'
      using errcode = 'insufficient_privilege';
  end if;

  if new.blocked is distinct from old.blocked
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin may change the blocked flag'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_privileges on public.profiles;
create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- 7) Realtime: admin deletes should disappear for everyone live. messages is already in
--    the supabase_realtime publication (0006) but used default replica identity (INSERT
--    only). Switch to REPLICA IDENTITY FULL so DELETE payloads carry channel_id — the
--    client's channel_id realtime filter needs it to match delete events (and cascade
--    deletes of thread replies emit their own DELETE events, so the UI clears them too).
alter table public.messages replica identity full;
