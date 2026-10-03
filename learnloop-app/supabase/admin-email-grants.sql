create table if not exists public.admin_email_grants (
  email text primary key check (email = lower(btrim(email))),
  granted_by uuid not null references auth.users(id) on delete restrict,
  granted_at timestamptz not null default now()
);

alter table public.admin_email_grants enable row level security;
revoke all on public.admin_email_grants from anon, authenticated;
grant all on public.admin_email_grants to service_role;