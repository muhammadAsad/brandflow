import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (from) query = query.gte('scheduled_at', from);
    if (to)   query = query.lte('scheduled_at', to);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ posts: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { content, platforms, scheduled_at, media_urls, status } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // ── Plan limit check ───────────────────────────────────────────────────────
    const { data: profile } = await supabase.from('profiles').select('plan').eq('user_id', user.id).single();
    const plan = profile?.plan ?? 'free';
    const limitKey = `max_${plan}_posts`;

    const { data: limitRow } = await supabase
      .from('system_settings').select('value').eq('key', limitKey).single();
    const limit = Number(limitRow?.value ?? (plan === 'free' ? 10 : plan === 'pro' ? 500 : -1));

    if (limit !== -1) {
      const { count } = await supabase
        .from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: `You've reached the ${limit}-post limit for the ${plan} plan. Upgrade to create more posts.` },
          { status: 403 }
        );
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    const { data, error } = await supabase.from('posts').insert({
      user_id:      user.id,
      content:      content.trim(),
      platforms:    platforms ?? [],
      scheduled_at: scheduled_at ?? null,
      media_urls:   media_urls ?? [],
      status:       status ?? (scheduled_at ? 'scheduled' : 'draft'),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Post id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ post: data });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Post id required' }, { status: 400 });

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
