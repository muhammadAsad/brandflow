import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

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
    const { data, error } = await db.from('system_settings').select('*').order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings: data ?? [] });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });
    const db = createAdminClient();
    const { data, error } = await db.from('system_settings')
      .update({ value, updated_by: admin.user.id, updated_at: new Date().toISOString() })
      .eq('key', key).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await db.from('admin_logs').insert({ admin_id: admin.user.id, admin_email: admin.profile.email, action: `Updated setting: ${key}`, details: { key, value } });
    return NextResponse.json({ setting: data });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
