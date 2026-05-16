import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { AdminShell } from './AdminShell';

export const metadata = { title: 'Admin — BrandFlow' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin-access');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name, email')
    .eq('user_id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/');

  return (
    <AdminShell
      adminName={profile.full_name || 'Admin'}
      adminEmail={profile.email || user.email || ''}
    >
      {children}
    </AdminShell>
  );
}
