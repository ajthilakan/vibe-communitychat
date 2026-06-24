-- CommunityChat v1 — DB-side rate limiting (U5, KTD-3)
-- A BEFORE INSERT trigger on messages counts the author's recent rows and rejects
-- floods. Enforced in Postgres so it cannot be bypassed by a client holding the
-- public anon key. Thresholds start conservative and are tuned in review:
--   > 5 messages in 10 seconds, OR > 30 messages in 60 seconds.
-- SECURITY DEFINER so the count sees all of the author's rows regardless of RLS.

create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_10s int;
  recent_60s int;
begin
  select count(*) into recent_10s
  from public.messages
  where user_id = new.user_id
    and created_at > now() - interval '10 seconds';

  select count(*) into recent_60s
  from public.messages
  where user_id = new.user_id
    and created_at > now() - interval '60 seconds';

  if recent_10s >= 5 then
    raise exception 'Rate limit: too many messages in a short burst. Please slow down.'
      using errcode = 'check_violation';
  end if;

  if recent_60s >= 30 then
    raise exception 'Rate limit: message quota exceeded for the last minute. Please wait a moment.'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();
