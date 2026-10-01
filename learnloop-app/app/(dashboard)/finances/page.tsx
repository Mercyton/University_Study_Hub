import AdminFinances from '@/components/AdminFinances';
import StudentFinances from '@/components/StudentFinances';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export default async function FinancesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return user?.app_metadata?.role === 'admin' ? <AdminFinances /> : <StudentFinances />;
}
