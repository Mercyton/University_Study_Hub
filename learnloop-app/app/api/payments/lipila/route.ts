import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

const subscriptionAmount = 50;
const supportedProviders = ['airtel', 'mtn', 'zamtel'] as const;
type Provider = (typeof supportedProviders)[number];

function normalizePhoneNumber(value: unknown) {
  if (typeof value !== 'string') return null;
  const digits = value.replace(/\D/g, '');
  const internationalNumber = digits.startsWith('0') ? `260${digits.slice(1)}` : digits;
  return /^260\d{9}$/.test(internationalNumber) ? internationalNumber : null;
}

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) throw new Error('Payment storage is not configured.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Please sign in to make a payment.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 });
  }

  const paymentRequest = body as { provider?: unknown; phoneNumber?: unknown };
  const provider = paymentRequest.provider;
  const phoneNumber = normalizePhoneNumber(paymentRequest.phoneNumber);
  if (typeof provider !== 'string' || !supportedProviders.includes(provider as Provider) || !phoneNumber) {
    return NextResponse.json({ error: 'Choose a supported network and enter a valid Zambian mobile number.' }, { status: 400 });
  }

  const apiKey = process.env.LIPILA_API_KEY;
  const apiBaseUrl = process.env.LIPILA_API_BASE_URL;
  const webhookSecret = process.env.LIPILA_WEBHOOK_SECRET;
  let appUrl: URL;
  let apiBaseUrlObject: URL;
  try {
    if (!apiKey || !apiBaseUrl || !webhookSecret || !process.env.APP_URL) throw new Error();
    appUrl = new URL(process.env.APP_URL);
    apiBaseUrlObject = new URL(apiBaseUrl);
    if (appUrl.protocol !== 'https:' || apiBaseUrlObject.protocol !== 'https:') throw new Error();
  } catch {
    return NextResponse.json({ error: 'Lipila payments are not configured on the server.' }, { status: 503 });
  }

  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch {
    return NextResponse.json({ error: 'Payment storage is not configured.' }, { status: 503 });
  }

  const { data: subscription, error: subscriptionError } = await adminClient
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();
  if (subscriptionError) return NextResponse.json({ error: 'Unable to verify your subscription.' }, { status: 500 });
  if (subscription?.status === 'active' && subscription.current_period_end && new Date(subscription.current_period_end) > new Date()) {
    return NextResponse.json({ error: 'Your study pass is already active.' }, { status: 409 });
  }

  const { data: pendingPayment, error: pendingError } = await adminClient
    .from('lipila_payment_attempts')
    .select('reference_id, created_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pendingError) return NextResponse.json({ error: 'Unable to check for a pending payment.' }, { status: 500 });
  if (pendingPayment && Date.now() - new Date(pendingPayment.created_at).getTime() < 15 * 60 * 1000) {
    return NextResponse.json({ referenceId: pendingPayment.reference_id, status: 'pending' }, { status: 202 });
  }

  const referenceId = randomUUID();
  const { error: insertError } = await adminClient.from('lipila_payment_attempts').insert({
    user_id: user.id,
    reference_id: referenceId,
    provider,
    phone_number: phoneNumber,
    amount: subscriptionAmount,
    currency: 'ZMW',
    status: 'pending',
  });
  if (insertError) return NextResponse.json({ error: 'Unable to create a payment request.' }, { status: 500 });

  let gatewayResponse: Response;
  try {
    const endpoint = new URL('/api/v1/collections/mobile-money', apiBaseUrlObject);
    const callbackUrl = new URL('/api/webhooks/lipila', appUrl).toString();
    gatewayResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey,
        callbackUrl,
      },
      body: JSON.stringify({
        referenceId,
        amount: subscriptionAmount,
        narration: 'LearnLoop monthly study pass',
        accountNumber: phoneNumber,
        currency: 'ZMW',
        email: user.email,
        referenceData: `Selected network: ${provider}`,
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return NextResponse.json({ referenceId, status: 'pending', message: 'Payment request status is pending confirmation.' }, { status: 202 });
  }

  const gatewayData = await gatewayResponse.json().catch(() => null) as {
    amount?: number;
    currency?: string;
    identifier?: string;
    status?: string;
    type?: string;
  } | null;
  if (!gatewayResponse.ok || !gatewayData || (gatewayData.status !== 'Pending' && gatewayData.status !== 'Successful' && gatewayData.status !== 'Failed')) {
    await adminClient.from('lipila_payment_attempts').update({ status: 'failed' }).eq('reference_id', referenceId);
    return NextResponse.json({ error: 'Lipila could not start this payment. Please try again.' }, { status: 502 });
  }

  if (gatewayData.status === 'Pending') {
    await adminClient.from('lipila_payment_attempts').update({ lipila_identifier: gatewayData.identifier ?? null }).eq('reference_id', referenceId);
  } else {
    const { error } = await adminClient.rpc('process_lipila_payment', {
      p_reference_id: referenceId,
      p_status: gatewayData.status,
      p_identifier: gatewayData.identifier ?? null,
      p_amount: gatewayData.amount ?? subscriptionAmount,
      p_currency: gatewayData.currency ?? 'ZMW',
      p_type: gatewayData.type ?? 'Collection',
    });
    if (error) return NextResponse.json({ error: 'Payment status could not be recorded.' }, { status: 500 });
  }

  return NextResponse.json({ referenceId, status: gatewayData.status.toLowerCase() }, { status: 202 });
}

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const referenceId = new URL(request.url).searchParams.get('referenceId');
  if (!referenceId) return NextResponse.json({ error: 'Payment reference is required.' }, { status: 400 });

  let adminClient;
  try {
    adminClient = getAdminClient();
  } catch {
    return NextResponse.json({ error: 'Payment storage is not configured.' }, { status: 503 });
  }
  const { data, error } = await adminClient.from('lipila_payment_attempts').select('status').eq('reference_id', referenceId).eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Unable to check payment status.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  return NextResponse.json({ status: data.status });
}