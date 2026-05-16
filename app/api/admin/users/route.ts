import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('is_admin,email,full_name').eq('user_id', user.id).single();
  if (!profile?.is_admin) return null;
  return { user, profile };
}

async function logAction(db: ReturnType<typeof createAdminClient>, adminId: string, adminEmail: string, action: string, details: object, targetId?: string, targetEmail?: string) {
  await db.from('admin_logs').insert({ admin_id: adminId, admin_email: adminEmail, action, target_user_id: targetId, target_user_email: targetEmail, details });
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const plan   = searchParams.get('plan') ?? '';
    const status = searchParams.get('status') ?? '';
    const limit  = parseInt(searchParams.get('limit') ?? '50');
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const db = createAdminClient();
    let query = db.from('profiles').select('*');

    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    if (plan && plan !== 'all') query = query.eq('plan', plan);
    if (status === 'locked') query = query.eq('is_locked', true);
    if (status === 'admin')  query = query.eq('is_admin', true);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data ?? [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, action, value, reason, note } = body as {
      id: string;
      action: 'lock' | 'unlock' | 'change_plan' | 'set_admin' | 'add_note';
      value?: string;
      reason?: string;
      note?: string;
    };
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    const db = createAdminClient();
    const { data: target } = await db.from('profiles').select('email,full_name').eq('user_id', id).single();

    let updates: Record<string, unknown> = {};
    let logAction_str: string = action;

    if (action === 'lock')        { updates = { is_locked: true, lock_reason: reason ?? '' }; logAction_str = `Locked user: ${reason ?? ''}`; }
    else if (action === 'unlock') { updates = { is_locked: false, lock_reason: null }; logAction_str = 'Unlocked user'; }
    else if (action === 'change_plan') { updates = { plan: value }; logAction_str = `Changed plan to ${value}`; }
    else if (action === 'set_admin')   { updates = { is_admin: value === 'true' }; logAction_str = `Set is_admin = ${value}`; }
    else if (action === 'add_note')    { updates = { admin_notes: note }; logAction_str = 'Updated admin notes'; }

    const { data, error } = await db.from('profiles').update(updates).eq('user_id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAction(db, admin.user.id, admin.profile.email, logAction_str, { action, value, reason }, id, target?.email);
    return NextResponse.json({ user: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
