alter table public.mtruck_fleet
add column if not exists last_lat double precision,
add column if not exists last_lng double precision,
add column if not exists speed_kph numeric;

create table if not exists public.mtruck_realtime_events (

  id uuid primary key default gen_random_uuid(),

  event_type text,

  payload jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_realtime_time
on public.mtruck_realtime_events(created_at desc);
