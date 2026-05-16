import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { logAdminAction } from '@/lib/admin-log';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminProfile } = await supabase.from('profiles').select('is_admin,email,full_name').eq('user_id', user.id).single();
    if (!adminProfile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId } = await params;
    const db = createAdminClient();

    const { data: target } = await db.from('profiles').select('email,full_name,is_admin').eq('user_id', userId).single();
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Mark the target profile as being impersonated
    await db.from('profiles').update({ impersonated_by: user.id }).eq('user_id', userId);

    // Generate a magic link token for the target user via service role
    const { data: linkData, error } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email: target.email,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ''}/dashboard?impersonated=1` },
    });

    if (error || !linkData?.properties?.action_link) {
      return NextResponse.json({ error: 'Could not generate impersonation link' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      adminEmail: adminProfile.email,
      action: 'Impersonated user',
      targetUserId: userId,
      targetUserEmail: target.email,
    });

    return NextResponse.json({ url: linkData.properties.action_link });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const db = createAdminClient();
    await db.from('profiles').update({ impersonated_by: null }).eq('user_id', userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
