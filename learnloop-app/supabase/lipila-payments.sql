create table if not exists public.lipila_payment_attempts (
  reference_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('airtel', 'mtn', 'zamtel')),
  phone_number text not null,
  amount numeric(10, 2) not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'successful', 'failed')),
  lipila_identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lipila_payment_attempts_user_created_idx
  on public.lipila_payment_attempts (user_id, created_at desc);

alter table public.lipila_payment_attempts enable row level security;
revoke all on public.lipila_payment_attempts from anon, authenticated;
grant all on public.lipila_payment_attempts to service_role;

create or replace function public.process_lipila_payment(
  p_reference_id text,
  p_status text,
  p_identifier text,
  p_amount numeric,
  p_currency text,
  p_type text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_attempt public.lipila_payment_attempts%rowtype;
begin
  select * into payment_attempt
  from public.lipila_payment_attempts
  where reference_id = p_reference_id
  for update;

  if not found then
    return 'not_found';
  end if;

  if payment_attempt.amount <> p_amount
    or payment_attempt.currency <> p_currency
    or p_type <> 'Collection'
    or p_status not in ('Successful', 'Failed') then
    return 'mismatch';
  end if;

  if payment_attempt.status <> 'pending' then
    return payment_attempt.status;
  end if;

  if p_status = 'Failed' then
    update public.lipila_payment_attempts
    set status = 'failed', lipila_identifier = p_identifier, updated_at = now()
    where reference_id = p_reference_id;
    return 'failed';
  end if;

  update public.lipila_payment_attempts
  set status = 'successful', lipila_identifier = p_identifier, updated_at = now()
  where reference_id = p_reference_id;

  update public.subscriptions
  set status = 'active',
      provider = payment_attempt.provider,
      current_period_start = now(),
      current_period_end = now() + interval '30 days'
  where user_id = payment_attempt.user_id;

  if not found then
    insert into public.subscriptions (user_id, status, provider, current_period_start, current_period_end)
    values (payment_attempt.user_id, 'active', payment_attempt.provider, now(), now() + interval '30 days');
  end if;

  return 'successful';
end;
$$;

revoke all on function public.process_lipila_payment(text, text, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.process_lipila_payment(text, text, text, numeric, text, text) to service_role;