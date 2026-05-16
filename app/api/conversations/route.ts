import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status   = searchParams.get('status')   ?? '';
  const platform = searchParams.get('platform') ?? '';
  const search   = searchParams.get('search')   ?? '';

  let query = supabase
    .from('conversations')
    .select('*, contacts(id, full_name, email, company)')
    .eq('user_id', user.id);

  if (status && status !== 'all')     query = query.eq('status', status);
  if (platform && platform !== 'all') query = query.eq('platform', platform);
  if (search) query = query.ilike('last_message', `%${search}%`);

  const { data, error } = await query.order('last_message_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversations: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { platform, contact_id, last_message } = body;
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  const { data, error } = await supabase.from('conversations').insert({
    user_id: user.id,
    platform,
    contact_id: contact_id ?? null,
    last_message: last_message ?? '',
    status: 'open',
    unread_count: 0,
    last_message_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversation: data });
}
