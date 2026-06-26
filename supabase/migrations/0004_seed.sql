-- CommunityChat v1 — seed the single server + fixed channel set (U6)
-- Idempotent: a fixed server UUID + ON CONFLICT guards let this run safely more
-- than once. v1 has exactly one server and no server-create UI (KTD-1).

insert into public.servers (id, name)
values ('11111111-1111-1111-1111-111111111111', 'CommunityChat')
on conflict (id) do nothing;

insert into public.channels (server_id, slug, name, position)
values
  ('11111111-1111-1111-1111-111111111111', 'welcome',        'welcome',        0),
  ('11111111-1111-1111-1111-111111111111', 'world-cup-2026', 'world-cup-2026', 1),
  ('11111111-1111-1111-1111-111111111111', 'tv-shows',       'tv-shows',       2),
  ('11111111-1111-1111-1111-111111111111', 'books',          'books',          3),
  ('11111111-1111-1111-1111-111111111111', 'games',          'games',          4)
on conflict (server_id, slug) do nothing;
