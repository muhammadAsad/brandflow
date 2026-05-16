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

/** GET — return all settings as a plain key→value object (not an array) */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = createAdminClient();
    const { data, error } = await db.from('system_settings').select('key,value').order('key');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Convert [{key, value}] array → {key: value} object so the settings
    // page can spread it directly into the SystemSettings state
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return NextResponse.json({ settings: map });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

/**
 * POST — bulk-save all settings at once.
 * The admin settings page sends the full SystemSettings object here.
 * We upsert every key so missing rows are created automatically.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json() as Record<string, unknown>;
    const db   = createAdminClient();
    const now  = new Date().toISOString();

    const rows = Object.entries(body).map(([key, value]) => ({
      key,
      value,
      updated_by: admin.user.id,
      updated_at: now,
    }));

    const { error } = await db
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db.from('admin_logs').insert({
      admin_id:    admin.user.id,
      admin_email: admin.profile.email,
      action:      'Updated system settings (bulk save)',
      details:     body,
    });

    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

/**
 * PATCH — update a single setting by key (used by feature flags etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { key, value } = await request.json();
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    const db  = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('system_settings')
      .upsert({ key, value, updated_by: admin.user.id, updated_at: now }, { onConflict: 'key' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await db.from('admin_logs').insert({
      admin_id:    admin.user.id,
      admin_email: admin.profile.email,
      action:      `Updated setting: ${key}`,
      details:     { key, value },
    });

    return NextResponse.json({ setting: data });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
