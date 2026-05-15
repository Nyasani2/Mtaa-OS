alter table public.hookup_profiles
add column if not exists primary_language text default 'EN';

alter table public.hookup_profiles
add column if not exists secondary_languages text[] default '{}';

alter table public.hookup_profiles
add column if not exists auto_translate boolean default true;
