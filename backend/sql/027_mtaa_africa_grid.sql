create table if not exists public.mtaa_cross_border_routes (

  id uuid primary key default gen_random_uuid(),

  origin_country text,

  destination_country text,

  cargo_type text,

  distance_km numeric,

  risk_level text,

  estimated_cost numeric,

  border_delay_hours numeric,

  created_at timestamptz default now()
);

create table if not exists public.mtaa_cross_border_settlements (

  id uuid primary key default gen_random_uuid(),

  gross_usd numeric,

  platform_fee numeric,

  net_usd numeric,

  created_at timestamptz default now()
);

create index if not exists idx_mtaa_cross_border_routes
on public.mtaa_cross_border_routes(created_at desc);
