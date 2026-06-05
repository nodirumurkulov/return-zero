-- 016_ads_daily_unique_keys.sql  (RUN-88 — idempotent seed upserts)

create unique index if not exists meta_ads_daily_natural_key
  on meta_ads_daily (date, campaign_name, ad_name, placement);

create unique index if not exists google_ads_daily_natural_key
  on google_ads_daily (date, campaign_name, ad_group);
