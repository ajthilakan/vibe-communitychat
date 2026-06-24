-- CommunityChat v1 — enable Realtime for messages (U10)
-- Done in SQL, not the dashboard, so the build stays hands-off (former H3).
-- v1 only INSERTs messages (no edit/delete, KTD-7), so default replica identity
-- is sufficient — INSERT payloads carry the new row. Idempotent guard so re-runs
-- don't error on a table already in the publication.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
