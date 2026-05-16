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
    const { data, error } = await db.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ codes: data ?? [] });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { code, description, discount_type, discount_value, applies_to_plan, duration, duration_months, max_uses, expires_at } = body;
    if (!code?.trim() || !discount_type || discount_value == null) return NextResponse.json({ error: 'code, discount_type and discount_value required' }, { status: 400 });
    const db = createAdminClient();
    const { data, error } = await db.from('promo_codes').insert({
      code: code.trim().toUpperCase(), description, discount_type, discount_value,
      applies_to_plan: applies_to_plan || null, duration: duration || 'once',
      duration_months: duration_months || null, max_uses: max_uses || null,
      expires_at: expires_at || null, is_active: true, used_count: 0,
      created_by: admin.user.id,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await db.from('admin_logs').insert({ admin_id: admin.user.id, admin_email: admin.profile.email, action: `Created promo code: ${code.toUpperCase()}`, details: { discount_type, discount_value } });
    return NextResponse.json({ code: data }, { status: 201 });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = createAdminClient();
    const { data, error } = await db.from('promo_codes').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ code: data });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = createAdminClient();
    const { error } = await db.from('promo_codes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
