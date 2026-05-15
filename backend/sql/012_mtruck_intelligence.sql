create table if not exists public.mtruck_fleet_snapshots (

  id uuid primary key default gen_random_uuid(),

  total_trucks integer default 0,

  active_trucks integer default 0,

  idle_trucks integer default 0,

  overloaded_zones integer default 0,

  delayed_deliveries integer default 0,

  fuel_alerts integer default 0,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_eta_predictions (

  id uuid primary key default gen_random_uuid(),

  delivery_id uuid,

  estimated_minutes integer,

  traffic_multiplier numeric default 1,

  risk_level text default 'LOW',

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_eta_delivery
on public.mtruck_eta_predictions(delivery_id);

create index if not exists idx_mtruck_snapshot_created
on public.mtruck_fleet_snapshots(created_at desc);
