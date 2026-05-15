create table if not exists public.mtruck_marketplace (

  id uuid primary key default gen_random_uuid(),

  customer_id uuid,

  title text,

  cargo_type text,

  pickup_location text,

  dropoff_location text,

  weight_kg numeric default 0,

  budget_amount numeric default 0,

  status text default 'OPEN',

  created_at timestamptz default now()
);

create table if not exists public.mtruck_warehouse_inventory (

  id uuid primary key default gen_random_uuid(),

  warehouse_id uuid,

  item_name text,

  quantity numeric default 0,

  unit_type text,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_ai_insights (

  id uuid primary key default gen_random_uuid(),

  active_shipments integer default 0,

  delayed_shipments integer default 0,

  active_fleet integer default 0,

  network_health text default 'GOOD',

  generated_at timestamptz default now()
);

create index if not exists idx_mtruck_marketplace
on public.mtruck_marketplace(status);

create index if not exists idx_mtruck_inventory
on public.mtruck_warehouse_inventory(warehouse_id);
