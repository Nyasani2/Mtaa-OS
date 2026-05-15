create table if not exists public.mtruck_freight_auctions (

  id uuid primary key default gen_random_uuid(),

  title text,

  cargo_type text,

  pickup text,

  dropoff text,

  status text default 'OPEN',

  winner_truck_id uuid,

  created_at timestamptz default now()
);

create table if not exists public.mtruck_freight_bids (

  id uuid primary key default gen_random_uuid(),

  auction_id uuid,

  truck_id uuid,

  bid_amount numeric,

  created_at timestamptz default now()
);

create index if not exists idx_mtruck_auction_status
on public.mtruck_freight_auctions(status);
