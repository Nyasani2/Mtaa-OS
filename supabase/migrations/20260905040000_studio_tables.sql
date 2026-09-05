-- Studio drafts (in-progress content)
create table if not exists public.studio_drafts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  title text,
  body text,
  content_type text default 'video',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Live broadcasts
create table if not exists public.studio_broadcasts (
  id uuid primary key default gen_random_uuid(),
  broadcaster_id uuid references auth.users(id),
  title text not null,
  description text,
  status text default 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  peak_viewers integer default 0,
  created_at timestamptz default now()
);

-- Recordings (captured audio/video)
create table if not exists public.studio_recordings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  title text,
  duration_seconds integer default 0,
  file_url text,
  recording_type text default 'audio',
  created_at timestamptz default now()
);

-- Scenes (for multi-camera / broadcasts)
create table if not exists public.studio_scenes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  name text not null,
  layout text default 'single',
  config jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Thumbnails
create table if not exists public.studio_thumbnails (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  track_id uuid references studio_tracks(id) on delete set null,
  image_url text,
  created_at timestamptz default now()
);

-- Device pairings
create table if not exists public.studio_pairings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  device_id text,
  device_name text,
  paired_at timestamptz default now(),
  last_seen_at timestamptz
);

-- Revenue shares
create table if not exists public.studio_revenue_shares (
  id uuid primary key default gen_random_uuid(),
  track_id uuid references studio_tracks(id) on delete cascade,
  collaborator_id uuid references auth.users(id),
  share_percent numeric default 0,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.studio_drafts enable row level security;
alter table public.studio_broadcasts enable row level security;
alter table public.studio_recordings enable row level security;
alter table public.studio_scenes enable row level security;
alter table public.studio_thumbnails enable row level security;
alter table public.studio_pairings enable row level security;
alter table public.studio_revenue_shares enable row level security;

drop policy if exists s_drafts_rw on public.studio_drafts;
create policy s_drafts_rw on public.studio_drafts for all to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists s_broadcasts_sel on public.studio_broadcasts;
drop policy if exists s_broadcasts_ins on public.studio_broadcasts;
create policy s_broadcasts_sel on public.studio_broadcasts for select to authenticated using (true);
create policy s_broadcasts_ins on public.studio_broadcasts for insert to authenticated with check (auth.uid() = broadcaster_id);

drop policy if exists s_recordings_rw on public.studio_recordings;
create policy s_recordings_rw on public.studio_recordings for all to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists s_scenes_rw on public.studio_scenes;
create policy s_scenes_rw on public.studio_scenes for all to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists s_thumbs_rw on public.studio_thumbnails;
create policy s_thumbs_rw on public.studio_thumbnails for all to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists s_pairs_rw on public.studio_pairings;
create policy s_pairs_rw on public.studio_pairings for all to authenticated using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists s_rev_rw on public.studio_revenue_shares;
create policy s_rev_rw on public.studio_revenue_shares for all to authenticated using (true) with check (true);
