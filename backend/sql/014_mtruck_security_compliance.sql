create table if not exists public.mtruck_security_alerts (

  id uuid primary key default gen_random_uuid(),

  truck_id uuid not null,

  shipment_id uuid,

  alert_type text not null,

  severity text default 'LOW',

  metadata jsonb default '{}'::jsonb,

  resolved boolean default false,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_freight_settlements (

  id uuid primary key default gen_random_uuid(),

  shipment_id uuid not null,

  customer_id uuid,

  driver_id uuid,

  total_amount numeric default 0,

  platform_fee numeric default 0,

  tax_amount numeric default 0,

  driver_payout numeric default 0,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_security_alerts
on public.mtruck_security_alerts(truck_id);

create index if not exists idx_mtruck_settlements
on public.mtruck_freight_settlements(shipment_id);
