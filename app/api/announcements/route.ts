import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ announcements: [] });

    const { data: profile } = await supabase.from('profiles').select('plan').eq('user_id', user.id).single();
    const plan = profile?.plan || 'free';

    const now = new Date().toISOString();
    const { data } = await supabase
      .from('announcements')
      .select('id, title, message, type, dismissable, target_plans')
      .eq('is_active', true)
      .or(`show_from.is.null,show_from.lte.${now}`)
      .or(`show_until.is.null,show_until.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(3);

    const filtered = (data || []).filter(a => {
      if (!a.target_plans || a.target_plans.length === 0) return true;
      return a.target_plans.includes(plan);
    });

    return NextResponse.json({ announcements: filtered });
  } catch {
    return NextResponse.json({ announcements: [] });
  }
}
