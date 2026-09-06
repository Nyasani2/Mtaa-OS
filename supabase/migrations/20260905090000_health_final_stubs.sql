-- Population records (for government health officers)
create table if not exists public.health_population_records (
  id uuid primary key default gen_random_uuid(),
  recorded_by uuid references auth.users(id),
  facility_id uuid,
  region text,
  demographic_group text,
  count integer default 0,
  notes text,
  created_at timestamptz default now()
);
alter table public.health_population_records enable row level security;
create policy "Allow authenticated insert" on public.health_population_records for insert to authenticated with check (true);
create policy "Allow authenticated select" on public.health_population_records for select to authenticated using (true);

-- Data sharing grants/consents
create table if not exists public.health_sharing_grants (
  id uuid primary key default gen_random_uuid(),
  grantor_id uuid references auth.users(id),
  grantee_id uuid, -- Can be facility_id or user_id
  grantee_type text, -- 'facility' or 'user'
  data_scope text[], -- e.g., ['vitals', 'prescriptions']
  status text default 'active', -- 'active', 'revoked'
  expires_at timestamptz,
  created_at tustamptz default now()
);
alter table public.health_sharing_grants enable row level security;
create policy "Allow authenticated insert" on public.health_sharing_grants for insert to authenticated with check (auth.uid() = grantor_id);
create policy "Allow authenticated select" on public health_sharing_grants for select to authenticated using (auth.uid() = grantor_id);
