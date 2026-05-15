create table if not exists public.mtruck_control_tower_logs (

  id uuid primary key default gen_random_uuid(),

  decision text,

  congestion_index numeric,

  fleet_health text,

  prediction jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_control_logs
on public.mtruck_control_tower_logs(created_at desc);
