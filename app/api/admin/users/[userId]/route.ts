import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-log';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('is_admin,email,full_name').eq('user_id', user.id).single();
  if (!p?.is_admin) return null;
  return { user, profile: p };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { userId } = await params;
    const db = createAdminClient();

    const [
      { data: profile },
      { data: posts },
      { data: campaigns },
      { data: adminLogs },
      { data: featureOverrides },
    ] = await Promise.all([
      db.from('profiles').select('*').eq('user_id', userId).single(),
      db.from('posts').select('id,created_at,status,platform').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      db.from('campaigns').select('id,name,created_at,status').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
      db.from('admin_logs').select('*').eq('target_user_id', userId).order('created_at', { ascending: false }).limit(50),
      db.from('user_feature_overrides').select('*').eq('user_id', userId),
    ]);

    return NextResponse.json({
      profile,
      activity: {
        posts: posts ?? [],
        campaigns: campaigns ?? [],
      },
      adminHistory: adminLogs ?? [],
      featureOverrides: featureOverrides ?? [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { userId } = await params;
    const body = await request.json();
    const db = createAdminClient();

    const { data: target } = await db.from('profiles').select('email').eq('user_id', userId).single();
    const { data, error } = await db.from('profiles').update(body).eq('user_id', userId).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction({
      adminId: admin.user.id, adminEmail: admin.profile.email,
      action: `Updated user profile`, targetUserId: userId, targetUserEmail: target?.email,
      details: body,
    });

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { userId } = await params;
    const db = createAdminClient();

    const { data: target } = await db.from('profiles').select('email').eq('user_id', userId).single();

    // Delete in order: posts, campaigns, contacts, conversations, then profile
    await Promise.allSettled([
      db.from('posts').delete().eq('user_id', userId),
      db.from('campaigns').delete().eq('user_id', userId),
      db.from('contacts').delete().eq('user_id', userId),
      db.from('conversations').delete().eq('user_id', userId),
      db.from('automations').delete().eq('user_id', userId),
      db.from('user_feature_overrides').delete().eq('user_id', userId),
    ]);

    await db.from('profiles').delete().eq('user_id', userId);

    await logAdminAction({
      adminId: admin.user.id, adminEmail: admin.profile.email,
      action: 'Deleted user account', targetUserId: userId, targetUserEmail: target?.email,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
