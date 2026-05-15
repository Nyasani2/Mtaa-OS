create table if not exists public.mtruck_port_shipments (

  id uuid primary key default gen_random_uuid(),

  shipment_id uuid,

  container_number text,

  port_name text,

  arrival_eta timestamptz,

  customs_status text default 'PENDING',

  created_at timestamptz default now()
);

create table if not exists public.mtruck_customs_clearance (

  id uuid primary key default gen_random_uuid(),

  shipment_id uuid,

  country_code text,

  tax_amount numeric default 0,

  clearance_status text default 'PENDING',

  created_at timestamptz default now()
);

create table if not exists public.mtruck_trade_corridors (

  id uuid primary key default gen_random_uuid(),

  route text,

  trade_volume numeric default 0,

  congestion text default 'LOW',

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_port_shipments
on public.mtruck_port_shipments(shipment_id);

create index if not exists idx_mtruck_customs
on public.mtruck_customs_clearance(shipment_id);
