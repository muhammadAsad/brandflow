import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns the admin's authenticated server client so all DB operations
 * run under the admin's session (satisfying the "Admin full access" RLS
 * policy) — no service-role key required.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin,email')
    .eq('user_id', user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { user, profile, db: supabase };
}

/** GET — return all settings as a plain key→value object (not an array) */
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await admin.db
      .from('system_settings')
      .select('key,value')
      .order('key');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Convert [{key, value}] array → {key: value} object so the settings
    // page can spread it directly into the SystemSettings state
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;

    return NextResponse.json({ settings: map });
  } catch (e) {
    console.error('[admin/settings GET]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
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
    const now  = new Date().toISOString();

    const rows = Object.entries(body).map(([key, value]) => ({
      key,
      value,
      updated_by: admin.user.id,
      updated_at: now,
    }));

    const { error } = await admin.db
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('[admin/settings POST] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.db.from('admin_logs').insert({
      admin_id:    admin.user.id,
      admin_email: admin.profile.email,
      action:      'Updated system settings (bulk save)',
      details:     body,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[admin/settings POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
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

    const now = new Date().toISOString();

    const { data, error } = await admin.db
      .from('system_settings')
      .upsert({ key, value, updated_by: admin.user.id, updated_at: now }, { onConflict: 'key' })
      .select()
      .single();

    if (error) {
      console.error('[admin/settings PATCH] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.db.from('admin_logs').insert({
      admin_id:    admin.user.id,
      admin_email: admin.profile.email,
      action:      `Updated setting: ${key}`,
      details:     { key, value },
    });

    return NextResponse.json({ setting: data });
  } catch (e) {
    console.error('[admin/settings PATCH]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
