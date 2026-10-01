-- Seed subscriptions for existing non-admin Auth users.
-- Register at least three student accounts first to see several rows in the admin dashboard.
do $$
declare
  first_user uuid;
  second_user uuid;
  third_user uuid;
begin
  select id into first_user
  from auth.users
  where coalesce(raw_app_meta_data ->> 'role', '') <> 'admin'
  order by created_at
  limit 1 offset 0;

  select id into second_user
  from auth.users
  where coalesce(raw_app_meta_data ->> 'role', '') <> 'admin'
  order by created_at
  limit 1 offset 1;

  select id into third_user
  from auth.users
  where coalesce(raw_app_meta_data ->> 'role', '') <> 'admin'
  order by created_at
  limit 1 offset 2;

  if first_user is not null then
    update public.subscriptions
    set status = 'active', provider = 'airtel', current_period_start = now() - interval '10 days', current_period_end = now() + interval '20 days'
    where user_id = first_user;
    if not found then
      insert into public.subscriptions (user_id, status, provider, current_period_start, current_period_end)
      values (first_user, 'active', 'airtel', now() - interval '10 days', now() + interval '20 days');
    end if;
  end if;

  if second_user is not null then
    update public.subscriptions
    set status = 'active', provider = 'mtn', current_period_start = now() - interval '5 days', current_period_end = now() + interval '25 days'
    where user_id = second_user;
    if not found then
      insert into public.subscriptions (user_id, status, provider, current_period_start, current_period_end)
      values (second_user, 'active', 'mtn', now() - interval '5 days', now() + interval '25 days');
    end if;
  end if;

  if third_user is not null then
    update public.subscriptions
    set status = 'expired', provider = 'none', current_period_start = now() - interval '60 days', current_period_end = now() - interval '30 days'
    where user_id = third_user;
    if not found then
      insert into public.subscriptions (user_id, status, provider, current_period_start, current_period_end)
      values (third_user, 'expired', 'none', now() - interval '60 days', now() - interval '30 days');
    end if;
  end if;
end $$;