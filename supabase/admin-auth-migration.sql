create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admin_users_email_lower_idx
  on public.admin_users (lower(email));

create table if not exists public.admin_sessions (
  token_hash text primary key,
  user_id uuid not null references public.admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists admin_sessions_user_id_idx on public.admin_sessions (user_id);
create index if not exists admin_sessions_expires_at_idx on public.admin_sessions (expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_admin_users_updated_at on public.admin_users;
create trigger set_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;

revoke all on table public.admin_users, public.admin_sessions from public, anon, authenticated;
grant all on table public.admin_users, public.admin_sessions to service_role;

create or replace function public.authenticate_admin(p_email text, p_password text)
returns table (id uuid, email text)
language sql
security invoker
set search_path = ''
as $$
  select users.id, users.email
  from public.admin_users users
  where lower(users.email) = lower(p_email)
    and users.active = true
    and users.password_hash = extensions.crypt(p_password, users.password_hash)
  limit 1;
$$;

create or replace function public.is_admin_session_valid(p_token_hash text)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_sessions sessions
    join public.admin_users users on users.id = sessions.user_id
    where sessions.token_hash = p_token_hash
      and sessions.expires_at > now()
      and users.active = true
  );
$$;

revoke all on function public.authenticate_admin(text, text) from public, anon, authenticated;
revoke all on function public.is_admin_session_valid(text) from public, anon, authenticated;
grant execute on function public.authenticate_admin(text, text) to service_role;
grant execute on function public.is_admin_session_valid(text) to service_role;

-- Create or replace an administrator manually in the Supabase SQL Editor:
-- insert into public.admin_users (email, password_hash)
-- values ('admin@example.com', extensions.crypt('replace-with-a-strong-password', extensions.gen_salt('bf', 12)))
-- on conflict ((lower(email))) do update
-- set password_hash = excluded.password_hash,
--     active = true,
--     updated_at = now();
--
-- Changing a password should also invalidate that user's existing sessions:
-- delete from public.admin_sessions
-- where user_id = (select id from public.admin_users where lower(email) = lower('admin@example.com'));
