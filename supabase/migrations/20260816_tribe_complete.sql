do $$ begin
  -- tribes capability/category columns
  if not exists (select 1 from information_schema.columns where table_name='tribes' and column_name='category') then
    alter table public.tribes add column category text not null default 'interest';
    alter table public.tribes add column country text; alter table public.tribes add column region text;
    alter table public.tribes add column language text; alter table public.tribes add column cover_image text;
    alter table public.tribes add column visibility text not null default 'public';
    alter table public.tribes add column capabilities jsonb not null default '{"history":false,"knowledge":true,"marketplace":false,"creator":false,"live":true,"events":true,"chat":true}';
  end if;
  if not exists (select 1 from information_schema.columns where table_name='tribe_members' and column_name='role') then
    alter table public.tribe_members add column role text not null default 'member';
    alter table public.tribe_members add column status text not null default 'active';
  end if;
end $$;

create table if not exists public.tribe_elections (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  title text not null, description text,
  election_type text not null default 'admin',
  status text not null default 'open',
  closes_at timestamptz, created_by uuid references auth.users(id),
  created_at timestamptz not null default now());
create table if not exists public.tribe_votes (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references public.tribe_elections(id) on delete cascade,
  voter_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid references auth.users(id), option text,
  created_at timestamptz not null default now(),
  unique (election_id, voter_id));
create table if not exists public.tribe_knowledge_entries (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  kind text not null default 'article', title text not null, summary text, body text,
  category text, tags text[], era text, location text, media_urls text[],
  references_json jsonb not null default '[]',
  author_id uuid references auth.users(id),
  verification text not null default 'community',
  status text not null default 'approved',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.tribe_artifacts (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  name text not null, description text, significance text, period text, origin text, location text,
  photos text[], video text, contributor_id uuid references auth.users(id),
  verification text not null default 'community', sources jsonb not null default '[]',
  created_at timestamptz not null default now());
create table if not exists public.tribe_interviews (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  speaker_id uuid references auth.users(id), speaker_name text, topic text, language text,
  translation text, summary text, audio_url text, video_url text, transcript text, photos text[],
  contributor_id uuid references auth.users(id), created_at timestamptz not null default now());

create index if not exists idx_tribe_members_tribe on public.tribe_members(tribe_id);
create index if not exists idx_tribe_members_user on public.tribe_members(user_id);
create index if not exists idx_tribe_posts_tribe on public.tribe_posts(tribe_id, created_at desc);
create index if not exists idx_tribe_knowledge_tribe on public.tribe_knowledge_entries(tribe_id);
create index if not exists idx_tribe_elections_tribe on public.tribe_elections(tribe_id);

-- ── server-side governance helpers (500-member milestone enforced HERE, not in UI) ──
create or replace function public.tribe_member_count(t uuid) returns int language sql stable security definer set search_path=public as
$$ select count(*)::int from public.tribe_members where tribe_id = t and status = 'active' $$;
create or replace function public.tribe_role_of(t uuid, u uuid) returns text language sql stable security definer set search_path=public as
$$ select coalesce((select role from public.tribe_members where tribe_id=t and user_id=u and status='active'), 'none') $$;
create or replace function public.tribe_is_member(t uuid, u uuid) returns boolean language sql stable security definer set search_path=public as
$$ select public.tribe_role_of(t,u) <> 'none' $$;
create or replace function public.tribe_can_govern(t uuid, u uuid) returns boolean language sql stable security definer set search_path=public as
$$ select public.tribe_is_member(t,u) and public.tribe_member_count(t) >= 500 $$;

create or replace function public.tribe_create_election(t uuid, title text, etype text, closes_at timestamptz)
returns uuid language plpgsql security definer set search_path=public as $$
declare eid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth required'; end if;
  if not public.tribe_can_govern(t, uid) then
    raise exception 'Governance unlocks at 500 members and requires membership';
  end if;
  insert into public.tribe_elections (tribe_id, title, election_type, closes_at, created_by)
  values (t, title, etype, closes_at, uid) returning id into eid;
  return eid;
end $$;

create or replace function public.tribe_cast_vote(eid uuid, candidate uuid, opt text)
returns void language plpgsql security definer set search_path=public as $$
declare e public.tribe_elections%rowtype; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'auth required'; end if;
  select * into e from public.tribe_elections where id = eid;
  if e.id is null then raise exception 'election not found'; end if;
  if e.status <> 'open' or (e.closes_at is not null and now() > e.closes_at) then raise exception 'election closed'; end if;
  if not public.tribe_is_member(e.tribe_id, uid) then raise exception 'members only'; end if;
  if candidate is not null and not public.tribe_is_member(e.tribe_id, candidate) then raise exception 'candidate must be a member'; end if;
  if exists (select 1 from public.tribe_votes where election_id = eid and voter_id = uid) then raise exception 'already voted'; end if;
  insert into public.tribe_votes (election_id, voter_id, candidate_id, option) values (eid, uid, candidate, opt);
end $$;

-- creator auto-membership
create or replace function public.tribe_after_insert() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.creator_id is not null then
    insert into public.tribe_members (tribe_id, user_id, role) values (new.id, new.creator_id, 'creator')
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists tribe_after_insert on public.tribes;
create trigger tribe_after_insert after insert on public.tribes for each row execute function public.tribe_after_insert();

-- ── RLS ──
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.tribe_elections enable row level security;
alter table public.tribe_votes enable row level security;
alter table public.tribe_knowledge_entries enable row level security;
alter table public.tribe_artifacts enable row level security;
alter table public.tribe_interviews enable row level security;

drop policy if exists tribes_read on public.tribes;
create policy tribes_read on public.tribes for select to public using (visibility = 'public' or public.tribe_is_member(id, auth.uid()));
drop policy if exists tribes_create on public.tribes;
create policy tribes_create on public.tribes for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists tribes_update on public.tribes;
create policy tribes_update on public.tribes for update to authenticated using (public.tribe_role_of(id, auth.uid()) in ('creator','admin','moderator'));

drop policy if exists members_read on public.tribe_members;
create policy members_read on public.tribe_members for select to public using (true);
drop policy if exists members_join on public.tribe_members;
create policy members_join on public.tribe_members for insert to authenticated with check (user_id = auth.uid() or public.tribe_role_of(tribe_id, auth.uid()) in ('creator','admin','moderator'));
drop policy if exists members_leave on public.tribe_members;
create policy members_leave on public.tribe_members for delete to authenticated using (user_id = auth.uid() or public.tribe_role_of(tribe_id, auth.uid()) in ('creator','admin','moderator'));
drop policy if exists members_role_update on public.tribe_members;
create policy members_role_update on public.tribe_members for update to authenticated using (public.tribe_role_of(tribe_id, auth.uid()) in ('creator','admin'));

-- elections/votes: readable by members; writable ONLY via security-definer functions (no direct insert)
drop policy if exists elections_read on public.tribe_elections;
create policy elections_read on public.tribe_elections for select to authenticated using (public.tribe_is_member(tribe_id, auth.uid()));
drop policy if exists votes_read on public.tribe_votes;
create policy votes_read on public.tribe_votes for select to authenticated using (public.tribe_is_member((select tribe_id from public.tribe_elections where id = election_id), auth.uid()));

-- knowledge/artifacts/interviews: members+public read (public tribes), members write, elders/mods/admins verify
drop policy if exists knowledge_read on public.tribe_knowledge_entries;
create policy knowledge_read on public.tribe_knowledge_entries for select to public using (status = 'approved' and (select visibility from public.tribes where id = tribe_id) = 'public' or public.tribe_is_member(tribe_id, auth.uid()));
drop policy if exists knowledge_write on public.tribe_knowledge_entries;
create policy knowledge_write on public.tribe_knowledge_entries for insert to authenticated with check (public.tribe_is_member(tribe_id, auth.uid()) and author_id = auth.uid());
drop policy if exists knowledge_verify on public.tribe_knowledge_entries;
create policy knowledge_verify on public.tribe_knowledge_entries for update to authenticated using (public.tribe_role_of(tribe_id, auth.uid()) in ('creator','admin','moderator','elder'));
drop policy if exists artifacts_read on public.tribe_artifacts;
create policy artifacts_read on public.tribe_artifacts for select to public using (true);
drop policy if exists artifacts_write on public.tribe_artifacts;
create policy artifacts_write on public.tribe_artifacts for insert to authenticated with check (public.tribe_is_member(tribe_id, auth.uid()));
drop policy if exists interviews_read on public.tribe_interviews;
create policy interviews_read on public.tribe_interviews for select to public using (true);
drop policy if exists interviews_write on public.tribe_interviews;
create policy interviews_write on public.tribe_interviews for insert to authenticated with check (public.tribe_is_member(tribe_id, auth.uid()));

-- storage bucket for tribe media
insert into storage.buckets (id, name, public) values ('tribe-media','tribe-media', true) on conflict (id) do nothing;
drop policy if exists tribe_media_read on storage.objects;
create policy tribe_media_read on storage.objects for select to public using (bucket_id = 'tribe-media');
drop policy if exists tribe_media_write on storage.objects;
create policy tribe_media_write on storage.objects for insert to authenticated with check (bucket_id = 'tribe-media' and (storage.foldername(name))[1] = auth.uid()::text);
