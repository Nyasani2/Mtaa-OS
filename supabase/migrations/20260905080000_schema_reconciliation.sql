-- health_staff.full_name (fixes onboarding + find-care doctors)
alter table public.health_staff add column if not exists full_name text;
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='health_staff' and column_name='name') then
    execute 'update public.health_staff set full_name = name where full_name is null';
  elsif exists (select 1 from information_schema.columns where table_schema='public' and table_name='health_staff' and column_name='first_name') then
    execute 'update public.health_staff set full_name = trim(coalesce(first_name,'''') || '' '' || coalesce(last_name,'''')) where full_name is null';
  end if;
end $$;

-- health_emergency_cases (fixes Emergency queue)
create table if not exists public.health_emergency_cases (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid, patient_id uuid, patient_name text,
  chief_complaint text, severity text default 'medium',
  status text default 'waiting', created_at timestamptz default now()
);
alter table public.health_emergency_cases enable row level security;
drop policy if exists hec_sel on public.health_emergency_cases;
create policy hec_sel on public.health_emergency_cases for select to authenticated using (true);
drop policy if exists hec_ins on public.health_emergency_cases;
create policy hec_ins on public.health_emergency_cases for insert to authenticated with check (true);
drop policy if exists hec_upd on public.health_emergency_cases;
create policy hec_upd on public.health_emergency_cases for update to authenticated using (true);
