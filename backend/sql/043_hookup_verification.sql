create table if not exists public.hookup_verifications (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null,

  verification_type text,
  -- EMAIL | PHONE | GOV_ID | BIOMETRIC | LIVENESS

  status text default 'PENDING',
  -- PENDING | VERIFIED | REJECTED

  confidence_score integer default 0,

  document_url text,

  metadata jsonb default '{}',

  verified_at timestamptz,

  created_at timestamptz default now()
);

create index if not exists idx_hookup_verification_user
on public.hookup_verifications(user_id);
