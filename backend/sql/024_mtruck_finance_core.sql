create table if not exists public.mtruck_settlements (

  id uuid primary key default gen_random_uuid(),

  trip_id uuid,

  total_amount numeric,

  system_fee numeric,

  tax numeric,

  platform_revenue numeric,

  driver_payout numeric,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_settlements_trip
on public.mtruck_settlements(trip_id);
