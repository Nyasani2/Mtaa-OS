create table if not exists public.mtruck_driver_tokens (

  id uuid primary key default gen_random_uuid(),

  driver_id uuid,

  tokens integer default 0,

  event text,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_tokens_driver
on public.mtruck_driver_tokens(driver_id);
