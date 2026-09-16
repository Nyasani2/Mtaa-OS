-- ============================================================
-- MTAA OS V10 - Health Module Database Init / Repair
-- Run in: Supabase Dashboard -> SQL Editor   (or scripts/run-migrations.sh)
-- SAFE: fully idempotent. Fixes "column mrn does not exist".
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- core tables (create-if-missing; your live tables are kept) ----------
create table if not exists public.health_roles (
  id uuid primary key default uuid_generate_v4(),
  name varchar(50) unique not null,
  description text,
  permissions jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_facilities (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  type varchar(50) not null,
  license_number varchar(100),
  address text, city varchar(100), county varchar(100),
  phone varchar(20), email varchar(255),
  latitude decimal(10,8), longitude decimal(11,8),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_patients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  date_of_birth date,
  gender varchar(20),
  blood_group varchar(5),
  phone varchar(20), email varchar(255), address text,
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20),
  allergies jsonb default '[]',
  chronic_conditions jsonb default '[]',
  insurance_provider varchar(255),
  insurance_number varchar(100),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- >>> THE FIX: add mrn only if missing, backfill existing rows, then enforce <<<
alter table public.health_patients add column if not exists mrn varchar(50);
update public.health_patients set mrn = 'MRN-' || upper(substr(replace(id::text,'-',''),1,10))
 where mrn is null or mrn = '';
create unique index if not exists idx_patients_mrn on public.health_patients(mrn);

-- auto-assign mrn to future rows if app leaves it null
create or replace function public.health_set_mrn() returns trigger
language plpgsql as $$
begin
  if new.mrn is null or new.mrn = '' then
    new.mrn := 'MRN-' || upper(substr(replace(new.id::text,'-',''),1,10));
  end if;
  return new;
end $$;
drop trigger if exists trg_health_patients_mrn on public.health_patients;
create trigger trg_health_patients_mrn before insert on public.health_patients
  for each row execute function public.health_set_mrn();

create table if not exists public.health_staff (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  facility_id uuid references public.health_facilities(id),
  role varchar(50) not null,
  department varchar(100),
  license_number varchar(100),
  specialization varchar(255),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.health_patients(id) on delete cascade,
  doctor_id uuid references public.health_staff(id),
  facility_id uuid references public.health_facilities(id),
  appointment_type varchar(50) not null default 'consultation',
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes int default 30,
  status varchar(50) default 'scheduled',
  reason text, notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_prescriptions (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.health_patients(id) on delete cascade,
  doctor_id uuid references public.health_staff(id),
  facility_id uuid references public.health_facilities(id),
  prescription_number varchar(50) unique,
  diagnosis text,
  medications jsonb not null default '[]',
  instructions text,
  status varchar(50) default 'active',
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.health_lab_tests (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.health_patients(id) on delete cascade,
  ordered_by uuid references public.health_staff(id),
  facility_id uuid references public.health_facilities(id),
  test_name varchar(255) not null,
  test_type varchar(100),
  status varchar(50) default 'pending',
  sample_collected_at timestamptz,
  results jsonb,
  result_status varchar(50),
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- indexes ----------
create index if not exists idx_patients_user_id    on public.health_patients(user_id);
create index if not exists idx_patients_mrn        on public.health_patients(mrn);
create index if not exists idx_appt_patient        on public.health_appointments(patient_id);
create index if not exists idx_appt_doctor         on public.health_appointments(doctor_id);
create index if not exists idx_appt_date           on public.health_appointments(scheduled_date);
create index if not exists idx_rx_patient          on public.health_prescriptions(patient_id);
create index if not exists idx_lab_patient         on public.health_lab_tests(patient_id);
create index if not exists idx_lab_status          on public.health_lab_tests(status);

-- ---------- updated_at maintenance ----------
create or replace function public.update_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_patients_upd    on public.health_patients;
drop trigger if exists trg_appt_upd        on public.health_appointments;
drop trigger if exists trg_rx_upd          on public.health_prescriptions;
drop trigger if exists trg_lab_upd         on public.health_lab_tests;
drop trigger if exists trg_facilities_upd  on public.health_facilities;
drop trigger if exists trg_staff_upd       on public.health_staff;
create trigger trg_patients_upd   before update on public.health_patients    for each row execute function public.update_updated_at();
create trigger trg_appt_upd       before update on public.health_appointments for each row execute function public.update_updated_at();
create trigger trg_rx_upd         before update on public.health_prescriptions for each row execute function public.update_updated_at();
create trigger trg_lab_upd        before update on public.health_lab_tests    for each row execute function public.update_updated_at();
create trigger trg_facilities_upd before update on public.health_facilities   for each row execute function public.update_updated_at();
create trigger trg_staff_upd      before update on public.health_staff        for each row execute function public.update_updated_at();

-- ---------- RLS ----------
alter table public.health_patients      enable row level security;
alter table public.health_appointments  enable row level security;
alter table public.health_prescriptions enable row level security;
alter table public.health_lab_tests     enable row level security;

-- authenticated users can read/write health data (tighten per-role later)
do $$
begin
  if not exists (select 1 from pg_policies where tablename='health_patients' and policyname='health_patients_auth') then
    create policy health_patients_auth on public.health_patients for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='health_appointments' and policyname='health_appt_auth') then
    create policy health_appt_auth on public.health_appointments for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='health_prescriptions' and policyname='health_rx_auth') then
    create policy health_rx_auth on public.health_prescriptions for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='health_lab_tests' and policyname='health_lab_auth') then
    create policy health_lab_auth on public.health_lab_tests for all to authenticated using (true) with check (true);
  end if;
end $$;
