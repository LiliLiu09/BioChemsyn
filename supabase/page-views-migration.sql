create table if not exists public.page_views_daily (
  view_date date not null,
  path text not null check (char_length(path) between 1 and 500),
  views bigint not null default 0 check (views >= 0),
  updated_at timestamptz not null default now(),
  primary key (view_date, path)
);

alter table public.page_views_daily enable row level security;

revoke all on table public.page_views_daily from public, anon, authenticated;
grant select, insert, update on table public.page_views_daily to service_role;

comment on table public.page_views_daily is
  'Aggregated public website page views by Australia/Perth date and normalized path. No visitor identifiers are stored.';
