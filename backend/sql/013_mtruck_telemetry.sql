create table if not exists public.mtruck_telemetry (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid not null,

  speed_kph numeric default 0,

  engine_temp numeric default 0,

  fuel_level numeric default 100,

  engine_health numeric default 100,

  battery_voltage numeric default 12,

  gps_lat double precision,

  gps_lng double precision,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_fuel_alerts (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid not null,

  fuel_level numeric,

  severity text,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_maintenance_alerts (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid not null,

  issue text,

  severity text,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_telemetry_truck
on public.mtruck_telemetry(truck_id);

create index if not exists idx_mtruck_fuel_alerts
on public.mtruck_fuel_alerts(truck_id);

create index if not exists idx_mtruck_maintenance_alerts
on public.mtruck_maintenance_alerts(truck_id);
