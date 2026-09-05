-- Identity verification requests
create table if not exists public.identity_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  id_type text not null,
  id_number text not null,
  front_photo_url text,
  back_photo_url text,
  selfie_url text,
  status text default 'pending',
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- Blocked contacts
create table if not exists public.blocked_contacts (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users(id),
  blocked_user_id uuid references auth.users(id),
  reason text,
  created_at timestamptz default now(),
  unique(blocker_id, blocked_user_id)
);

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.identity_verification_requests enable row level security;
alter table public.blocked_contacts enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists verification_select on public.identity_verification_requests;
drop policy if exists verification_insert on public.identity_verification_requests;
create policy verification_select on public.identity_verification_requests for select to authenticated using (auth.uid() = user_id);
create policy verification_insert on public.identity_verification_requests for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists blocked_select on public.blocked_contacts;
drop policy if exists blocked_insert on public.blocked_contacts;
drop policy if exists blocked_delete on public.blocked_contacts;
create policy blocked_select on public.blocked_contacts for select to authenticated using (auth.uid() = blocker_id);
create policy blocked_insert on public.blocked_contacts for insert to authenticated with check (auth.uid() = blocker_id);
create policy blocked_delete on public.blocked_contacts for delete to authenticated using (auth.uid() = blocker_id);

drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated using (auth.uid() = user_id);
