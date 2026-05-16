import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('is_admin,email,full_name').eq('user_id', user.id).single();
  if (!p?.is_admin) return null;
  return { user, profile: p };
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = createAdminClient();
    const now = new Date();
    const day24h   = new Date(now.getTime() - 24 * 3600000).toISOString();
    const day7     = new Date(now.getTime() - 7 * 86400000).toISOString();
    const day30    = new Date(now.getTime() - 30 * 86400000).toISOString();

    const [
      { count: totalUsers },
      { count: activeToday },
      { count: newThisWeek },
      { count: lockedCount },
      { data: profiles },
      { data: allProfiles },
    ] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }),
      db.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', day24h),
      db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', day7),
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('is_locked', true),
      db.from('profiles').select('plan').then(r => r),
      db.from('profiles').select('created_at').gte('created_at', day30).order('created_at'),
    ]);

    // Plan breakdown
    const planBreakdown: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
    (profiles ?? []).forEach((p: { plan: string }) => {
      const pl = p.plan ?? 'free';
      planBreakdown[pl] = (planBreakdown[pl] ?? 0) + 1;
    });

    // Daily signups for last 30 days
    const dailyMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = 0;
    }
    (allProfiles ?? []).forEach((p: { created_at: string }) => {
      const key = p.created_at.split('T')[0];
      if (key in dailyMap) dailyMap[key]++;
    });
    const dailySignups = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // MRR estimate (pro × 29 + enterprise × 99, or 0 if no Stripe)
    const mrr = (planBreakdown.pro ?? 0) * 29 + (planBreakdown.enterprise ?? 0) * 99;

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activeToday: activeToday ?? 0,
      newThisWeek: newThisWeek ?? 0,
      lockedCount: lockedCount ?? 0,
      planBreakdown,
      dailySignups,
      mrr,
      failedPayments: 0, // Stripe integration placeholder
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
