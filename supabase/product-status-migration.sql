alter table public.products add column if not exists status text not null default 'published';
alter table public.products add column if not exists deleted_at timestamptz;

create index if not exists products_status_idx on public.products (status);
create index if not exists products_deleted_at_idx on public.products (deleted_at);

drop policy if exists "Public read products" on public.products;
create policy "Public read products"
on public.products for select
using (status = 'published' and deleted_at is null);
