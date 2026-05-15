create index if not exists idx_verification_type
on public.hookup_verifications(verification_type);

create index if not exists idx_verification_status
on public.hookup_verifications(status);
