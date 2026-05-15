create table if not exists public.mtaa_autonomous_dispatch_logs (

  id uuid primary key default gen_random_uuid(),

  surge jsonb,

  dispatch_count integer,

  created_at timestamptz default now()
);

create table if not exists public.mtaa_digital_trade_flows (

  id uuid primary key default gen_random_uuid(),

  origin_country text,

  destination_country text,

  cargo_type text,

  value numeric,

  status text,

  created_at timestamptz default now()
);

create index if not exists idx_mtaa_autonomous_logs
on public.mtaa_autonomous_dispatch_logs(created_at desc);
