create table if not exists public.hookup_events (

  id uuid primary key default gen_random_uuid(),

  host_id uuid not null,

  title text,
  description text,

  event_type text,
  -- SOCIAL | DATING | GROUP | VERIFIED_MEETUP

  location_lat double precision,
  location_lng double precision,

  start_time timestamptz,
  end_time timestamptz,

  max_attendees integer default 20,

  safety_level text default 'STANDARD',
  -- LOW | STANDARD | HIGH | VERIFIED_ONLY

  is_verified boolean default false,

  created_at timestamptz default now()
);

create table if not exists public.hookup_event_participants (

  id uuid primary key default gen_random_uuid(),

  event_id uuid not null,

  user_id uuid not null,

  status text default 'JOINED',
  -- JOINED | CHECKED_IN | LEFT | REMOVED

  checkin_time timestamptz
);

create index if not exists idx_events_location
on public.hookup_events(location_lat, location_lng);
