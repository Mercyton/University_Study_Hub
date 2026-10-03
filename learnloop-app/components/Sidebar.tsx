'use client';

import Link from 'next/link';
import { CreditCard, ShieldCheck, BookOpen, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/finances', label: 'Finances', icon: CreditCard },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
];

export default function Sidebar() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAdmin(data.user?.app_metadata?.role === 'admin');
    };

    void loadRole();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <aside className="w-full max-w-[260px] rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/30">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lg font-bold text-slate-950">
          L
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">LearnLoop</p>
          <h2 className="text-base font-semibold text-slate-100">Dashboard</h2>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems
          .filter(({ href }) => href !== '/admin' || isAdmin)
          .map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
          >
            <Icon className="h-4 w-4 text-lime-400" />
            {label}
          </Link>
          ))}
      </nav>

      <div className="mt-6 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
