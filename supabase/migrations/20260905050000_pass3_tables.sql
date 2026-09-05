create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references auth.users(id),
  title text not null, description text, price numeric default 0,
  currency text default 'KES', category text, location text,
  images jsonb default '[]'::jsonb, is_featured boolean default false,
  status text default 'active', created_at timestamptz default now()
);
create table if not exists public.jobs_disputes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid, raised_by uuid references auth.users(id),
  job_title text, reason text, description text,
  status text default 'open', created_at timestamptz default now()
);
create table if not exists public.jobs_bids (
  id uuid primary key default gen_random_uuid(),
  job_id uuid, bidder_id uuid references auth.users(id),
  job_title text, amount numeric default 0, proposal text,
  status text default 'pending', created_at timestamptz default now()
);
create table if not exists public.jobs_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  headline text, availability text, hourly_rate numeric default 0,
  updated_at timestamptz default now()
);
create table if not exists public.work_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text not null, description text, due_date text,
  priority text default 'normal', status text default 'open',
  created_at timestamptz default now()
);
create table if not exists public.health_population_records (
  id uuid primary key default gen_random_uuid(),
  region text not null, population_count integer default 0,
  notes text, recorded_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create table if not exists public.education_policies (
  id uuid primary key default gen_random_uuid(),
  school_id uuid, title text not null, body text,
  created_at timestamptz default now()
);
create table if not exists public.education_cctv_recordings (
  id uuid primary key default gen_random_uuid(),
  camera_id text, title text, url text, duration_seconds integer default 0,
  created_at timestamptz default now()
);
create table if not exists public.jobs_escrow_releases (
  id uuid primary key default gen_random_uuid(),
  job_id uuid, requested_by uuid references auth.users(id),
  status text default 'requested', created_at timestamptz default now()
);

alter table public.marketplace_listings enable row level security;
alter table public.jobs_disputes enable row level security;
alter table public.jobs_bids enable row level security;
alter table public.jobs_settings enable row level security;
alter table public.work_tasks enable row level security;
alter table public.health_population_records enable row level security;
alter table public.education_policies enable row level security;
alter table public.education_cctv_recordings enable row level security;
alter table public.jobs_escrow_releases enable row level security;

drop policy if exists ml_sel on public.marketplace_listings; create policy ml_sel on public.marketplace_listings for select to authenticated using (true);
drop policy if exists ml_ins on public.marketplace_listings; create policy ml_ins on public.marketplace_listings for insert to authenticated with check (auth.uid() = seller_id);
drop policy if exists jd_rw on public.jobs_disputes; create policy jd_rw on public.jobs_disputes for all to authenticated using (true) with check (true);
drop policy if exists jb_rw on public.jobs_bids; create policy jb_rw on public.jobs_bids for all to authenticated using (true) with check (true);
drop policy if exists js_rw on public.jobs_settings; create policy js_rw on public.jobs_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists wt_rw on public.work_tasks; create policy wt_rw on public.work_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists hpr_rw on public.health_population_records; create policy hpr_rw on public.health_population_records for all to authenticated using (true) with check (true);
drop policy if exists ep_rw on public.education_policies; create policy ep_rw on public.education_policies for all to authenticated using (true) with check (true);
drop policy if exists ecr_sel on public.education_cctv_recordings; create policy ecr_sel on public.education_cctv_recordings for select to authenticated using (true);
drop policy if exists jer_rw on public.jobs_escrow_releases; create policy jer_rw on public.jobs_escrow_releases for all to authenticated using (true) with check (true);
