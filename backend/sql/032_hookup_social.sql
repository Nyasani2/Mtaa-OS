create table if not exists public.hookup_groups (

  id uuid primary key default gen_random_uuid(),

  owner_id uuid not null,

  name text not null,

  description text,

  category text,

  privacy text default 'PUBLIC',

  cover_image text,

  member_count integer default 0,

  created_at timestamptz default now()
);

create table if not exists public.hookup_group_members (

  id uuid primary key default gen_random_uuid(),

  group_id uuid not null,

  user_id uuid not null,

  role text default 'MEMBER',

  joined_at timestamptz default now()
);

create table if not exists public.hookup_events (

  id uuid primary key default gen_random_uuid(),

  creator_id uuid not null,

  title text not null,

  description text,

  event_type text,

  event_mode text default 'PHYSICAL',

  country text,

  city text,

  venue text,

  lat double precision,

  lng double precision,

  starts_at timestamptz,

  cover_image text,

  created_at timestamptz default now()
);

create table if not exists public.hookup_event_attendees (

  id uuid primary key default gen_random_uuid(),

  event_id uuid not null,

  user_id uuid not null,

  joined_at timestamptz default now()
);

create table if not exists public.hookup_livestreams (

  id uuid primary key default gen_random_uuid(),

  host_id uuid not null,

  title text,

  description text,

  livestream_type text,

  stream_key text,

  stream_url text,

  thumbnail_url text,

  status text default 'OFFLINE',

  viewer_count integer default 0,

  started_at timestamptz,

  ended_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_groups_owner
on public.hookup_groups(owner_id);

create index if not exists idx_hookup_events_creator
on public.hookup_events(creator_id);

create index if not exists idx_hookup_livestreams_host
on public.hookup_livestreams(host_id);
