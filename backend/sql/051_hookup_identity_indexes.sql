create index if not exists idx_passport_id
on public.hookup_identity_passports(passport_id);

create index if not exists idx_cross_app_passport
on public.hookup_cross_app_activity(passport_id);
