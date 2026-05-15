create table if not exists public.hookup_interaction_graph (

  id uuid primary key default gen_random_uuid(),

  user_a uuid not null,

  user_b uuid not null,

  interaction_type text,
  -- MESSAGE | CALL | PAYMENT | BLOCK | REPORT

  risk_flag boolean default false,

  metadata jsonb default '{}',

  created_at timestamptz default now()
);

create table if not exists public.hookup_fraud_scores (

  id uuid primary key default gen_random_uuid(),

  user_id uuid unique not null,

  fraud_risk_score integer default 0,

  scam_reports integer default 0,

  suspicious_links integer default 0,

  last_updated timestamptz default now()
);

create index if not exists idx_hookup_graph_user_a
on public.hookup_interaction_graph(user_a);

create index if not exists idx_hookup_graph_user_b
on public.hookup_interaction_graph(user_b);
