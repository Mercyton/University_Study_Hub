'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Users } from 'lucide-react';

type Subscriber = {
  userId: string;
  email: string;
  fullName: string;
  university: string;
  status: string;
  provider: string | null;
  currentPeriodEnd: string | null;
};

type FinanceData = {
  activeSubscriptions: number;
  totalSubscriptions: number;
  subscribers: Subscriber[];
};

export default function AdminFinances() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/finance')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to load finance data.');
        return response.json() as Promise<FinanceData>;
      })
      .then((financeData) => {
        setData(financeData);
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
        <p className="mt-1 text-sm text-slate-400">Monitor Mobile Money subscription payments and active passes.</p>
      </div>

      {message && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-lime-400/30 bg-lime-400/10 p-5">
          <Users className="mb-4 h-5 w-5 text-lime-400" />
          <p className="text-sm text-slate-400">Active subscriptions</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{data?.activeSubscriptions ?? '-'}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <CreditCard className="mb-4 h-5 w-5 text-lime-400" />
          <p className="text-sm text-slate-400">All subscription records</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{data?.totalSubscriptions ?? '-'}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-lime-400" /><h2 className="text-lg font-semibold">Active subscribers</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-800 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">User</th><th className="px-3 py-3">University</th><th className="px-3 py-3">Provider</th><th className="px-3 py-3">Valid until</th></tr></thead>
            <tbody>{data?.subscribers.map((subscriber) => <tr key={subscriber.userId} className="border-b border-slate-800/70"><td className="px-3 py-3"><p className="font-medium text-slate-200">{subscriber.fullName || 'Unnamed user'}</p><p className="text-xs text-slate-500">{subscriber.email}</p></td><td className="px-3 py-3 text-slate-400">{subscriber.university || '-'}</td><td className="px-3 py-3 capitalize text-slate-400">{subscriber.provider || '-'}</td><td className="px-3 py-3 text-slate-400">{subscriber.currentPeriodEnd ? new Date(subscriber.currentPeriodEnd).toLocaleDateString() : '-'}</td></tr>)}</tbody>
          </table>
          {data && data.subscribers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No active subscriptions yet.</p>}
        </div>
      </section>

    </div>
  );
}