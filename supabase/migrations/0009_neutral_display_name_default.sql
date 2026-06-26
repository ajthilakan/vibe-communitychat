-- CommunityChat — stop defaulting display_name to the email local-part
-- Privacy: once anonymous read-only browsing (0007) ships, author display_name
-- becomes world-readable. The signup trigger (0001) seeded display_name from
-- split_part(email, '@', 1), which would publish an email fragment to the open web.
-- Redefine the trigger to seed a neutral handle instead. display_name_set stays
-- false (0008), so the user is still prompted to choose a real name on first entry.
--
-- Only the display_name default changes; the server auto-join is preserved verbatim.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- neutral, non-email default: "member-" + first 6 hex chars of the user id
  insert into public.profiles (id, display_name)
  values (new.id, 'member-' || substr(replace(new.id::text, '-', ''), 1, 6));

  insert into public.server_members (user_id, server_id)
  select new.id, s.id from public.servers s;

  return new;
end;
$$;
