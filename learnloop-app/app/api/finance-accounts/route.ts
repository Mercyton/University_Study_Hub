import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return NextResponse.json({ error: 'Payment account configuration is unavailable.' }, { status: 500 });

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: subscription, error: subscriptionError } = await adminClient.from('subscriptions').select('status, current_period_end').eq('user_id', user.id).maybeSingle();
  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  return NextResponse.json({
    subscription: subscription ? { status: subscription.status, currentPeriodEnd: subscription.current_period_end } : null,
  });
}