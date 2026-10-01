import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function isValidSignature(rawBody: string, request: Request, secret: string) {
  const webhookId = request.headers.get('webhook-id');
  const timestamp = request.headers.get('webhook-timestamp');
  const signatureHeader = request.headers.get('webhook-signature');
  if (!webhookId || !timestamp || !signatureHeader || !/^\d+$/.test(timestamp)) return false;

  const timestampSeconds = Number(timestamp);
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  if (key.length !== 32) return false;
  const signedPayload = `${webhookId}.${timestamp}.${rawBody}`;
  const expectedSignature = createHmac('sha256', key).update(signedPayload).digest();

  return signatureHeader.split(' ').some((entry) => {
    const [version, encodedSignature] = entry.split(',', 2);
    if (version !== 'v1' || !encodedSignature) return false;
    try {
      const receivedSignature = Buffer.from(encodedSignature, 'base64');
      return receivedSignature.length === expectedSignature.length && timingSafeEqual(receivedSignature, expectedSignature);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.LIPILA_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 });

  const rawBody = await request.text();
  if (!isValidSignature(rawBody, request, webhookSecret)) return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  const envelope = payload as Record<string, unknown>;
  const eventPayload = envelope.data === undefined ? envelope : envelope.data;
  if (!eventPayload || typeof eventPayload !== 'object' || Array.isArray(eventPayload)) {
    return NextResponse.json({ error: 'Invalid webhook event.' }, { status: 400 });
  }
  const event = eventPayload as Record<string, unknown>;
  const referenceId = event.referenceId;
  const status = event.status;
  if (typeof referenceId !== 'string'
    || (status !== 'Successful' && status !== 'Failed')
    || event.type !== 'Collection'
    || typeof event.currency !== 'string'
    || typeof event.amount !== 'number'
    || !Number.isFinite(event.amount)) {
    return NextResponse.json({ error: 'Unsupported webhook event.' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) return NextResponse.json({ error: 'Payment storage is not configured.' }, { status: 503 });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await adminClient.rpc('process_lipila_payment', {
    p_reference_id: referenceId,
    p_status: status,
    p_identifier: typeof event.identifier === 'string' ? event.identifier : null,
    p_amount: event.amount,
    p_currency: event.currency,
    p_type: event.type,
  });
  if (error) return NextResponse.json({ error: 'Unable to record payment status.' }, { status: 500 });
  if (data === 'not_found' || data === 'mismatch') return NextResponse.json({ error: 'Payment does not match this transaction.' }, { status: 400 });

  return NextResponse.json({ received: true });
}