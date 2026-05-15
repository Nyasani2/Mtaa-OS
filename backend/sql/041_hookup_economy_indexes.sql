create index if not exists idx_hookup_tokens_user
on public.hookup_tokens(user_id);

create index if not exists idx_hookup_boosts_user
on public.hookup_boost_purchases(user_id);

create index if not exists idx_hookup_ads_user
on public.hookup_ads_impressions(user_id);
