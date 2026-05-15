create table if not exists public.mtruck_gps_stream (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid,

  lat double precision,

  lng double precision,

  speed_kph numeric,

  heading numeric,

  timestamp timestamptz default now()
);

create index if not exists idx_mtruck_gps_truck
on public.mtruck_gps_stream(truck_id);

create index if not exists idx_mtruck_gps_time
on public.mtruck_gps_stream(timestamp desc);
