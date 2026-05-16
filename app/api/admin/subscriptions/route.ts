import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!profile?.is_admin) return null;
  return { user, profile };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const plan   = searchParams.get('plan') ?? 'all';
    const status = searchParams.get('status') ?? 'all';
    const sort   = searchParams.get('sort') ?? 'newest';

    const db = createAdminClient();

    // Join subscriptions with profiles for email/name
    let query = db
      .from('subscriptions')
      .select(`
        id, user_id, plan, status, amount, interval,
        current_period_end, cancel_at_period_end,
        stripe_customer_id, stripe_subscription_id, created_at,
        profiles ( email, full_name )
      `);

    if (plan !== 'all')   query = query.eq('plan', plan);
    if (status !== 'all') query = query.eq('status', status);
    if (search) query = query.or(`profiles.email.ilike.%${search}%,profiles.full_name.ilike.%${search}%`);

    const orderCol = sort === 'amount' ? 'amount' : 'created_at';
    const asc = sort === 'oldest';
    query = query.order(orderCol, { ascending: asc });

    const { data, error } = await query;
    if (error) throw error;

    // Flatten profile join
    const subscriptions = (data ?? []).map((s: Record<string, unknown>) => {
      const p = s.profiles as Record<string, string> | null;
      return {
        ...s,
        profiles: undefined,
        email: p?.email ?? '',
        full_name: p?.full_name ?? null,
      };
    });

    return NextResponse.json({ subscriptions });
  } catch (err) {
    console.error('[admin/subscriptions GET]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
