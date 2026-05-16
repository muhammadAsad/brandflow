import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Public endpoint — no auth required.
// GET /api/promo-codes/validate?code=CODENAME
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from('promo_codes')
      .select('id, code, description, discount_type, discount_value, applies_to_plan, max_uses, used_count, expires_at, is_active')
      .eq('code', code)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if (!data.is_active) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    if (data.max_uses !== null && data.used_count >= data.max_uses) {
      return NextResponse.json({ valid: false, reason: 'max_uses_reached' });
    }

    return NextResponse.json({
      valid: true,
      id: data.id,
      code: data.code,
      description: data.description,
      discount_type: data.discount_type,   // 'percentage' | 'fixed'
      discount_value: data.discount_value,  // e.g. 50 (%) or 1000 (cents)
      applies_to_plan: data.applies_to_plan,
    });
  } catch (err) {
    console.error('[promo-codes/validate]', err);
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 500 });
  }
}
