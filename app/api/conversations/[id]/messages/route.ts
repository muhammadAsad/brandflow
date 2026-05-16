import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify conversation belongs to user
  const { data: conv } = await supabase
    .from('conversations').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: conv } = await supabase
    .from('conversations').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const { content, direction = 'outbound' } = body;
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 });

  const now = new Date().toISOString();

  const { data, error } = await supabase.from('messages').insert({
    conversation_id: id,
    content: content.trim(),
    direction,
    read_at: direction === 'outbound' ? now : null,
    created_at: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update conversation's last_message and unread_count
  await supabase.from('conversations').update({
    last_message: content.trim(),
    last_message_at: now,
    unread_count: direction === 'inbound'
      ? supabase.rpc('increment_unread', { conv_id: id })
      : 0,
  }).eq('id', id).eq('user_id', user.id);

  return NextResponse.json({ message: data }, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === 'mark_read') {
    const now = new Date().toISOString();
    await supabase
      .from('messages')
      .update({ read_at: now })
      .eq('conversation_id', id)
      .eq('direction', 'inbound')
      .is('read_at', null);

    await supabase
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
