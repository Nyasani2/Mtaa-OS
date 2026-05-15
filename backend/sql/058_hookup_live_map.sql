create table if not exists public.hookup_live_presence (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  latitude double precision,
  longitude double precision,

  activity_type text,
  -- ACTIVE | TRAVELING | EVENT | DATING | INACTIVE

  visibility_mode text default 'STANDARD',
  -- PUBLIC | STANDARD | PRIVATE | GHOST

  last_seen timestamptz default now()
);

create table if not exists public.hookup_activity_heatmap (

  id uuid primary key default gen_random_uuid(),

  grid_lat int,
  grid_lng int,

  activity_score integer default 0,

  updated_at timestamptz default now()
);

create index if not exists idx_live_presence_user
on public.hookup_live_presence(user_id);
