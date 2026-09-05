-- Live streams
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  broadcaster_id uuid references auth.users(id),
  title text not null,
  viewer_count integer default 0,
  status text default 'live',
  started_at timestamptz default now()
);

-- Transaction history
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  amount numeric default 0,
  currency text default 'KES',
  type text default 'transfer',
  status text default 'completed',
  description text,
  created_at timestamptz default now()
);

-- Network contacts
create table if not exists public.network_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  contact_name text not null,
  phone text,
  email text,
  status text default 'active',
  last_interaction timestamptz
);

-- Location check-ins
create table if not exists public.location_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  place_name text not null,
  latitude numeric,
  longitude numeric,
  checked_in_at timestamptz default now()
);

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid,
  product_name text not null,
  quantity integer default 1,
  unit_price numeric default 0,
  created_at timestamptz default now()
);

-- Browsing history
create table if not exists public.browsing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null,
  url text,
  viewed_at timestamptz default now()
);

alter table public.live_streams enable row level security;
alter table public.transactions enable row level security;
alter table public.network_contacts enable row level security;
alter table public.location_checkins enable row level security;
alter table public.order_items enable row level security;
alter table public.browsing_history enable row level security;

drop policy if exists ls_sel on public.live_streams; create policy ls_sel on public.live_streams for select to authenticated using (true);
drop policy if exists tx_rw on public.transactions; create policy tx_rw on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists nc_rw on public.network_contacts; create policy nc_rw on public.network_contacts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists lc_rw on public.location_checkins; create policy lc_rw on public.location_checkins for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists oi_sel on public.order_items; create policy oi_sel on public.order_items for select to authenticated using (true);
drop policy if exists bh_rw on public.browsing_history; create policy bh_rw on public.browsing_history for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
