create table if not exists public.mtruck_pricing_state (

  id uuid primary key default gen_random_uuid(),

  demand integer,

  supply integer,

  surge_multiplier numeric,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_safety_alerts (

  id uuid primary key default gen_random_uuid(),

  type text,

  truck_id uuid,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_pricing_time
on public.mtruck_pricing_state(created_at desc);
