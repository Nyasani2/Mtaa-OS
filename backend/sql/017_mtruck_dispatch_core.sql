create table if not exists public.mtruck_dispatch_matches (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid,

  shipment_id uuid,

  score numeric,

  eta_minutes integer,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_dispatch_matches
on public.mtruck_dispatch_matches(score desc);

create index if not exists idx_mtruck_shipments_status
on public.mtruck_shipments(status);

create index if not exists idx_mtruck_fleet_status
on public.mtruck_fleet(status);
