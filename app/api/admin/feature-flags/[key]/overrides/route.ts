import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-log';
import { invalidateUserFeatures } from '@/lib/features';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('is_admin,email').eq('user_id', user.id).single();
  if (!p?.is_admin) return null;
  return { user, profile: p };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { key } = await params;
    const db = createAdminClient();
    const { data } = await db
      .from('user_feature_overrides')
      .select('*, profiles(email, full_name)')
      .eq('feature_key', key)
      .order('created_at', { ascending: false });
    return NextResponse.json({ overrides: data ?? [] });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { key } = await params;
    const { user_id, is_enabled, reason } = await request.json();
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const db = createAdminClient();
    const { data, error } = await db.from('user_feature_overrides')
      .upsert({ user_id, feature_key: key, is_enabled, reason, set_by_admin_id: admin.user.id }, { onConflict: 'user_id,feature_key' })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await invalidateUserFeatures(user_id);
    await logAdminAction({
      adminId: admin.user.id, adminEmail: admin.profile.email,
      action: `Set feature override: ${key} = ${is_enabled}`,
      targetUserId: user_id, details: { feature_key: key, is_enabled, reason },
    });

    return NextResponse.json({ override: data });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { key } = await params;
    const { user_id } = await request.json();
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const db = createAdminClient();
    await db.from('user_feature_overrides').delete().eq('user_id', user_id).eq('feature_key', key);
    await invalidateUserFeatures(user_id);

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
