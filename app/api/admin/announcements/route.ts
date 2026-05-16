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
    const { data, error } = await db.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcements: data ?? [] });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const body = await request.json();
    const { title, message, type, target_all_plans, show_to_plans, link_url, link_label, expires_at } = body;
    if (!title?.trim() || !message?.trim()) return NextResponse.json({ error: 'title and message required' }, { status: 400 });
    const db = createAdminClient();
    const { data, error } = await db.from('announcements').insert({
      title: title.trim(), message: message.trim(),
      type: type ?? 'info', is_active: true,
      target_all_plans: target_all_plans ?? true,
      show_to_plans: show_to_plans ?? [],
      link_url: link_url || null, link_label: link_label || null,
      expires_at: expires_at || null, created_by: admin.user.id,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcement: data }, { status: 201 });
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
    const { data, error } = await db.from('announcements').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ announcement: data });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = createAdminClient();
    const { error } = await db.from('announcements').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Internal error' }, { status: 500 }); }
}
