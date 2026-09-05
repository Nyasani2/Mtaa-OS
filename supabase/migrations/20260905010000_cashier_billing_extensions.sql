-- Ensure invoices table has the fields cashier workflow needs
alter table public.health_invoices add column if not exists payment_method text;
alter table public.health_invoices add column if not exists insurance_claim_id uuid;
alter table public.health_invoices add column if not exists items jsonb default '[]'::jsonb;
alter table public.health_invoices add column if not exists subtotal numeric default 0;
alter table public.health_invoices add column if not exists insurance_covered numeric default 0;
alter table public.health_invoices add column if not exists patient_paid numeric default 0;
alter table public.health_invoices add column if not exists status text default 'draft';

-- Ensure claims table has the fields we need
alter table public.health_insurance_claims add column if not exists status text default 'submitted';
alter table public.health_insurance_claims add column if not exists rejection_reason text;
alter table public.health_insurance_claims add column if not exists reviewer_notes text;
alter table public.health_insurance_claims add column if not exists reviewed_at timestamptz;
alter table public.health_insurance_claims add column if not exists reviewed_by uuid references auth.users(id);

-- Ensure policies table has the fields we need
alter table public.health_insurance_policies add column if not exists coverage_limit numeric default 0;
alter table public.health_insurance_policies add column if not exists used_amount numeric default 0;
alter table public.health_insurance_policies add column if not exists co_pay_percent numeric default 10;
alter table public.health_insurance_policies add column if not expires_at timestamptz;

-- RLS for the tables we just modified (idempotent)
alter table public.health_invoices enable row level security;
alter table public.health_insurance_claims enable row level security;
alter table public.health_insurance_policies enable row level security;

drop policy if exists invoices_select on public.health_invoices;
drop policy if exists invoices_insert on public.health_invoices;
drop policy if exists invoices_update on public.health_invoices;
create policy invoices_select on public.health_invoices for select to authenticated using (true);
create policy invoices_insert on public.health_invoices for insert to authenticated with check (true);
create policy invoices_update on public.health_invoices for update to authenticated using (true);

drop policy if exists claims_select on public.health_insurance_claims;
drop policy if exists claims_update on public.health_insurance_claims;
create policy claims_select on public.health_insurance_claims for select to authenticated using (true);
create policy claims_update on public.health_insurance_claims for update to authenticated using (true);

drop policy if exists policies_select on public.health_insurance_policies;
create policy policies_select on public.health_insurance_policies for select to authenticated using (true);
