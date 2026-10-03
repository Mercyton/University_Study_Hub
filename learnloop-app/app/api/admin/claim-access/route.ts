import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  if (user.app_metadata?.role === 'admin') {
    return NextResponse.json({ isAdmin: true });
  }

  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json({ isAdmin: false });
  }

  let adminClient;
  try {
    adminClient = createSupabaseAdminClient();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const email = user.email.trim().toLowerCase();
  const { data: grant, error: lookupError } = await adminClient
    .from('admin_email_grants')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!grant) return NextResponse.json({ isAdmin: false });

  const { error: promotionError } = await adminClient.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'admin' },
  });
  if (promotionError) return NextResponse.json({ error: promotionError.message }, { status: 500 });

  const { error: consumeError } = await adminClient
    .from('admin_email_grants')
    .delete()
    .eq('email', email);
  if (consumeError) return NextResponse.json({ error: consumeError.message }, { status: 500 });

  return NextResponse.json({ isAdmin: true });
}