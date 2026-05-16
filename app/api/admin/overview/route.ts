import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('is_admin,email').eq('user_id', user.id).single();
  if (!profile?.is_admin) return null;
  return { user, profile };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = createAdminClient();

    const [
      { count: totalUsers },
      { data: planBreakdown },
      { data: recentUsers },
      { data: recentLogs },
      { count: lockedCount },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('plan').then(({ data }) => ({
        data: data ? data.reduce((acc: Record<string, number>, r) => {
          const p = r.plan ?? 'free';
          acc[p] = (acc[p] ?? 0) + 1;
          return acc;
        }, {}) : {},
      })),
      db.from('profiles').select('user_id,email,full_name,plan,created_at').order('created_at', { ascending: false }).limit(5),
      db.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(10),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_locked', true),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      planBreakdown,
      recentUsers: recentUsers ?? [],
      recentLogs: recentLogs ?? [],
      lockedCount: lockedCount ?? 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
