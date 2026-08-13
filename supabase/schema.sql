create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  sku text not null default '',
  catalog_no text not null default '',
  cas text not null default '',
  name_cn text not null default '',
  name_en text not null default '',
  synonyms text not null default '',
  category text not null default '',
  formula text not null default '',
  molecular_weight text not null default '',
  purity text not null default '',
  stock integer not null default 0,
  package_size text not null default '',
  price numeric not null default 0,
  lead_time text not null default '',
  image text not null default '',
  details text not null default '',
  scale_note text not null default '',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_catalog_no_idx on public.products (catalog_no);
create index if not exists products_cas_idx on public.products (cas);
create index if not exists products_category_idx on public.products (category);

create table if not exists public.news_articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  category text not null default '公司新闻',
  author text not null default '凯森斯生物',
  source text not null default '凯森斯生物',
  published_at date not null default current_date,
  summary text not null default '',
  content text not null default '',
  cover_image text not null default '',
  views integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_articles_published_at_idx on public.news_articles (published_at desc);

create table if not exists public.info_articles (
  id text primary key,
  slug text not null unique,
  title text not null,
  category text not null default '服务咨询',
  author text not null default '凯森斯生物',
  source text not null default '凯森斯生物',
  published_at date not null default current_date,
  summary text not null default '',
  content text not null default '',
  cover_image text not null default '',
  views integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists info_articles_published_at_idx on public.info_articles (published_at desc);
create index if not exists info_articles_category_idx on public.info_articles (category);

create table if not exists public.site_content (
  id text primary key default 'main',
  "brandName" text not null default '',
  tagline text not null default '',
  "supportPhone" text not null default '',
  "heroTitle" text not null default '',
  "heroDescription" text not null default '',
  "primaryCta" text not null default '',
  notice text not null default '',
  "companyName" text not null default '',
  "contactEmail" text not null default '',
  address text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id text primary key,
  status text not null default '待处理' check (status in ('待处理', '已报价', '已关闭')),
  created_at timestamptz not null default now(),
  customer jsonb not null default '{}'::jsonb,
  lines jsonb not null default '[]'::jsonb,
  sales_note text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
create index if not exists quotes_status_idx on public.quotes (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_news_articles_updated_at on public.news_articles;
create trigger set_news_articles_updated_at
before update on public.news_articles
for each row execute function public.set_updated_at();

drop trigger if exists set_info_articles_updated_at on public.info_articles;
create trigger set_info_articles_updated_at
before update on public.info_articles
for each row execute function public.set_updated_at();

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists set_quotes_updated_at on public.quotes;
create trigger set_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.news_articles enable row level security;
alter table public.info_articles enable row level security;
alter table public.site_content enable row level security;
alter table public.quotes enable row level security;

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products for select
using (true);

drop policy if exists "Public read published news" on public.news_articles;
create policy "Public read published news"
on public.news_articles for select
using (published = true);

drop policy if exists "Public read published info" on public.info_articles;
create policy "Public read published info"
on public.info_articles for select
using (published = true);

drop policy if exists "Public read site content" on public.site_content;
create policy "Public read site content"
on public.site_content for select
using (true);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
on storage.objects for select
using (bucket_id = 'media');
