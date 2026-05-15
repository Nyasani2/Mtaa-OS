create table if not exists public.mtruck_fleet_commands (
  id uuid primary key default gen_random_uuid(),

  truck_id uuid not null,

  command_type text not null,

  payload jsonb default '{}'::jsonb,

  issued_by text,

  acknowledged boolean default false,

  acknowledged_at timestamptz,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_traffic_hotspots (
  id uuid primary key default gen_random_uuid(),

  lat double precision,
  lng double precision,

  congestion_score numeric default 0,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_commands_truck
on public.mtruck_fleet_commands(truck_id);

create index if not exists idx_mtruck_hotspots
on public.mtruck_traffic_hotspots(congestion_score);
