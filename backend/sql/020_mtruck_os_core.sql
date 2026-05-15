create table if not exists public.mtruck_os_logs (

  id uuid primary key default gen_random_uuid(),

  active_trucks integer,

  assignments integer,

  system_decision text,

  congestion_level numeric,

  raw_snapshot jsonb,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_os_logs_time
on public.mtruck_os_logs(created_at desc);
