create table if not exists public.mtaa_civic_trips (

  id uuid primary key default gen_random_uuid(),

  user_id uuid,

  type text,

  pickup_lat double precision,

  pickup_lng double precision,

  dropoff_lat double precision,

  dropoff_lng double precision,

  status text default 'PENDING',

  created_at timestamptz default now()
);

create table if not exists public.mtaa_civic_wallets (

  id uuid primary key default gen_random_uuid(),

  user_id uuid,

  subsidy_balance numeric default 0,

  created_at timestamptz default now()
);

create index if not exists idx_mtaa_civic_trips_status
on public.mtaa_civic_trips(status);
