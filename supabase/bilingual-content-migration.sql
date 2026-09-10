-- Manual additive migration for an existing installation (Supabase CLI is not installed here).
-- Apply once in the Supabase SQL editor before saving bilingual CMS content.
-- Safe to repeat. Existing Chinese values and CMS publication flags are preserved.
-- IMPORTANT: configure a server-side Supabase secret/service-role key or DATABASE_URL first.
-- Raw content rows become server-only because they contain unpublished English translations.
-- This does not translate remote content or copy the local demo catalogue into production.
begin;

alter table public.products
  add column if not exists translations jsonb not null default '{}'::jsonb
  check (jsonb_typeof(translations) = 'object');

alter table public.news_articles
  add column if not exists translations jsonb not null default '{}'::jsonb
  check (jsonb_typeof(translations) = 'object');

alter table public.info_articles
  add column if not exists translations jsonb not null default '{}'::jsonb
  check (jsonb_typeof(translations) = 'object');

alter table public.site_content
  add column if not exists translations jsonb not null default '{}'::jsonb
  check (jsonb_typeof(translations) = 'object');

alter table public.products enable row level security;
alter table public.news_articles enable row level security;
alter table public.info_articles enable row level security;
alter table public.site_content enable row level security;

drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read published news" on public.news_articles;
drop policy if exists "Public read published info" on public.info_articles;
drop policy if exists "Public read site content" on public.site_content;

revoke select on table public.products, public.news_articles, public.info_articles, public.site_content
  from public, anon, authenticated;
grant select on table public.products, public.news_articles, public.info_articles, public.site_content
  to service_role;

-- Ask PostgREST to discover the new columns after this transaction commits.
notify pgrst, 'reload schema';
commit;

-- Read-only post-migration check, if running this file in the SQL editor:
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('products', 'news_articles', 'info_articles', 'site_content')
  and column_name = 'translations'
order by table_name;
