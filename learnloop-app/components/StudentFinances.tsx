'use client';

import { useEffect, useState } from 'react';
import { Wallet, Smartphone, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type FinanceResponse = {
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
  } | null;
};

type StudentSubscription = NonNullable<FinanceResponse['subscription']> & {
  isActive: boolean;
  daysRemaining: number;
};

export default function StudentFinances() {
  const [selectedProvider, setSelectedProvider] = useState<'airtel' | 'mtn' | 'zamtel'>('airtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [subscription, setSubscription] = useState<StudentSubscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    const loadFinanceData = async () => {
      try {
        const response = await fetch('/api/finance-accounts', { cache: 'no-store' });
        if (!response.ok) throw new Error('Unable to verify your subscription right now.');
        const financeData = await response.json() as FinanceResponse;
        if (!isCurrent) return;

        if (financeData.subscription) {
          const expiresAt = financeData.subscription.currentPeriodEnd ? new Date(financeData.subscription.currentPeriodEnd) : null;
          const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
          setSubscription({ ...financeData.subscription, isActive: financeData.subscription.status === 'active' && !!expiresAt && daysRemaining > 0, daysRemaining });
        } else {
          setSubscription(null);
        }
      } catch {
        if (isCurrent) setSubscriptionError('Unable to verify your subscription right now. Please try again shortly.');
      } finally {
        if (isCurrent) setIsLoadingSubscription(false);
      }
    };

    void loadFinanceData();
    return () => { isCurrent = false; };
  }, []);

  const expiresAt = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const isActive = subscription?.isActive ?? false;
  const daysRemaining = subscription?.daysRemaining ?? 0;
  const formattedExpiry = expiresAt?.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const statusIsPending = isLoadingSubscription || !!subscriptionError;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentMessage('');
    try {
      const response = await fetch('/api/payments/lipila', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, phoneNumber }),
      });
      const result = await response.json() as { referenceId?: string; error?: string };
      if (!response.ok || !result.referenceId) throw new Error(result.error || 'Unable to start your payment.');

      setPaymentMessage('Payment prompt requested. Approve it on your phone with your Mobile Money PIN.');
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const statusResponse = await fetch(`/api/payments/lipila?referenceId=${encodeURIComponent(result.referenceId)}`, { cache: 'no-store' });
        if (!statusResponse.ok) continue;
        const payment = await statusResponse.json() as { status: string };
        if (payment.status === 'successful') {
          setPaymentMessage('Payment confirmed. Your study pass is now active.');
          window.location.reload();
          return;
        }
        if (payment.status === 'failed') {
          setPaymentMessage('Payment was not completed. Please check your phone number and try again.');
          return;
        }
      }
      setPaymentMessage('Payment is still pending. Approve the prompt on your phone; your pass will activate once Lipila confirms it.');
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Unable to start your payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finances & Subscription</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your monthly study pass to unlock full access to all past papers.
        </p>
      </div>

      <div aria-live="polite" className={`flex flex-col justify-between gap-4 rounded-xl border p-6 sm:flex-row sm:items-center ${statusIsPending ? 'border-slate-700 bg-slate-900' : isActive ? 'border-lime-400/30 bg-lime-400/10' : 'border-amber-500/30 bg-amber-500/10'}`}>
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-3 ${statusIsPending ? 'bg-slate-700 text-slate-200' : isActive ? 'bg-lime-400 text-slate-950' : 'bg-amber-500 text-slate-950'}`}><Wallet className="h-6 w-6" /></div>
          <div>
            <div className="flex items-center gap-2"><span className="text-lg font-semibold text-slate-100">{isLoadingSubscription ? 'Checking subscription' : subscriptionError ? 'Pass status unavailable' : isActive ? 'Active Pass' : 'Subscription Inactive'}</span>{isLoadingSubscription ? <span className="flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-100"><Clock className="h-3 w-3 animate-spin" /> Checking</span> : subscriptionError ? <span className="flex items-center gap-1 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-bold text-slate-100"><AlertCircle className="h-3 w-3" /> Unverified</span> : isActive ? <span className="flex items-center gap-1 rounded-full bg-lime-400 px-2 py-0.5 text-xs font-bold text-slate-950"><CheckCircle2 className="h-3 w-3" /> Unlocked</span> : <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-slate-950"><AlertCircle className="h-3 w-3" /> Action Required</span>}</div>
            <p className="mt-1 text-xs text-slate-400">{isLoadingSubscription ? 'Verifying your current pass.' : subscriptionError || (isActive ? `Valid until ${formattedExpiry} (${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining)` : 'Renew monthly subscription to stream study materials.')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100"><Smartphone className="h-5 w-5 text-lime-400" /> Pay via Mobile Money</h2>
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div><label className="mb-2 block text-xs text-slate-400">Select Network Provider</label><div className="grid grid-cols-3 gap-2">{(['airtel', 'mtn', 'zamtel'] as const).map((network) => <button key={network} type="button" aria-pressed={selectedProvider === network} onClick={() => setSelectedProvider(network)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${selectedProvider === network ? 'border-lime-400 bg-lime-400 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'}`}>{network === 'mtn' ? 'MTN' : network === 'zamtel' ? 'ZAMTEL' : 'Airtel'}</button>)}</div></div>
            <div><label className="mb-1 block text-xs text-slate-400">Mobile Money Phone Number</label><input type="tel" required placeholder="e.g. 0971234567" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-lime-400" /></div>
            <p className="text-xs text-slate-500">The payment prompt is sent by Lipila to this number. Select the network used by the wallet.</p>
            <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"><div className="flex justify-between text-slate-400"><span>Monthly Subscription:</span><span className="font-semibold text-slate-200">ZMW 50.00 / mo</span></div><div className="flex justify-between text-slate-400"><span>Access Granted:</span><span className="font-medium text-lime-400">All Programs & Papers</span></div></div>
            {paymentMessage && <p role="status" aria-live="polite" className="text-sm text-slate-300">{paymentMessage}</p>}
            <button type="submit" disabled={isProcessing || isLoadingSubscription || isActive || !!subscriptionError} className="flex w-full items-center justify-center gap-2 rounded-lg bg-lime-400 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-lime-300 disabled:opacity-50">{isProcessing ? <><Clock className="h-4 w-4 animate-spin" /> Waiting for payment...</> : isLoadingSubscription ? 'Checking subscription...' : isActive ? 'Pass Active' : subscriptionError ? 'Status unavailable' : 'Make Payment'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}