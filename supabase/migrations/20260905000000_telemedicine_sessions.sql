create table if not exists public.telemedicine_sessions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid,
  patient_id uuid references auth.users(id),
  doctor_id uuid references auth.users(id),
  facility_id uuid,
  status text not null default 'active',
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_seconds integer,
  notes text,
  created_at timestamptz default now()
);
alter table public.telemedicine_sessions enable row level security;
drop policy if exists telemed_select on public.telemedicine_sessions;
drop policy if exists telemed_insert on public.telemedicine_sessions;
drop policy if exists telemed_update on public.telemedicine_sessions;
create policy telemed_select on public.telemedicine_sessions for select to authenticated
  using (auth.uid() in (patient_id, doctor_id));
create policy telemed_insert on public.telemedicine_sessions for insert to authenticated
  with check (auth.uid() in (patient_id, doctor_id));
create policy telemed_update on public.telemedicine_sessions for update to authenticated
  using (auth.uid() in (patient_id, doctor_id));
