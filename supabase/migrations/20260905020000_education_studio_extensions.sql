-- Teacher applications table
create table if not exists public.education_teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  full_name text not null,
  email text,
  phone text,
  qualifications text,
  experience_years integer default 0,
  subjects text[],
  school_id uuid,
  status text default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- Courses table
create table if not exists public.education_courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructor_id uuid references auth.users(id),
  school_id uuid,
  category text,
  level text default 'beginner',
  duration_hours integer default 0,
  max_students integer default 30,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Course modules
create table if not exists public.education_course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references education_courses(id) on delete cascade,
  title text not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Course lessons
create table if not exists public.education_course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references education_course_modules(id) on delete cascade,
  title text not null,
  content_type text default 'video',
  content_url text,
  duration_minutes integer default 0,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Studio tracks (music/podcast)
create table if not exists public.studio_tracks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id),
  title text not null,
  artist text,
  genre text,
  track_type text default 'music',
  audio_url text,
  cover_url text,
  duration_seconds integer default 0,
  plays integer default 0,
  likes integer default 0,
  status text default 'published',
  created_at timestamptz default now()
);

-- RLS policies
alter table public.education_teacher_applications enable row level security;
alter table public.education_courses enable row level security;
alter table public.education_course_modules enable row level security;
alter table public.education_course_lessons enable row level security;
alter table public.studio_tracks enable row level security;

drop policy if exists teacher_apps_select on public.education_teacher_applications;
drop policy if exists teacher_apps_insert on public.education_teacher_applications;
create policy teacher_apps_select on public.education_teacher_applications for select to authenticated using (auth.uid() = user_id);
create policy teacher_apps_insert on public.education_teacher_applications for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists courses_select on public.education_courses;
drop policy if exists courses_insert on public.education_courses;
drop policy if exists courses_update on public.education_courses;
create policy courses_select on public.education_courses for select to authenticated using (true);
create policy courses_insert on public.education_courses for insert to authenticated with check (auth.uid() = instructor_id);
create policy courses_update on public.education_courses for update to authenticated using (auth.uid() = instructor_id);

drop policy if exists modules_select on public.education_course_modules;
drop policy if exists modules_insert on public.education_course_modules;
create policy modules_select on public.education_course_modules for select to authenticated using (true);
create policy modules_insert on public.education_course_modules for insert to authenticated with check (true);

drop policy if exists lessons_select on public.education_course_lessons;
drop policy if exists lessons_insert on public.education_course_lessons;
create policy lessons_select on public.education_course_lessons for select to authenticated using (true);
create policy lessons_insert on public.education_course_lessons for insert to authenticated with check (true);

drop policy if exists tracks_select on public.studio_tracks;
drop policy if exists tracks_insert on public.studio_tracks;
drop policy if exists tracks_update on public.studio_tracks;
create policy tracks_select on public.studio_tracks for select to authenticated using (true);
create policy tracks_insert on public.studio_tracks for insert to authenticated with check (auth.uid() = creator_id);
create policy tracks_update on public.studio_tracks for update to authenticated using (auth.uid() = creator_id);
