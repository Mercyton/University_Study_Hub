import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata?.role === 'admin' ? user : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const [{ data: subscriptions, error: subscriptionsError }, { data: usersData }] = await Promise.all([
    adminClient.from('subscriptions').select('user_id, status, provider, current_period_end'),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (subscriptionsError) return NextResponse.json({ error: subscriptionsError.message }, { status: 500 });

  const users = new Map((usersData?.users ?? []).map((user) => [user.id, user]));
  const active = (subscriptions ?? []).filter((subscription) => subscription.status === 'active');
  return NextResponse.json({
    activeSubscriptions: active.length,
    totalSubscriptions: subscriptions?.length ?? 0,
    subscribers: active.map((subscription) => {
      const user = users.get(subscription.user_id);
      return { userId: subscription.user_id, email: user?.email ?? '-', fullName: user?.user_metadata?.full_name ?? '', university: user?.user_metadata?.university ?? '', status: subscription.status, provider: subscription.provider, currentPeriodEnd: subscription.current_period_end };
    }),
  });
}
