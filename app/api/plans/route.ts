import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// No cache — admin price changes must reflect immediately
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use anon key — system_settings has a public SELECT policy (USING TRUE)
    // so no service-role key is required for reads.
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await db
      .from('system_settings')
      .select('key, value')
      .in('key', ['free_plan_price', 'pro_plan_price', 'enterprise_plan_price']);

    if (error) throw error;

    const map: Record<string, number> = {};
    for (const row of data ?? []) {
      map[row.key] = Number(row.value) || 0;
    }

    return NextResponse.json({
      free:       map['free_plan_price']       ?? 0,
      pro:        map['pro_plan_price']         ?? 29,
      enterprise: map['enterprise_plan_price']  ?? 99,
    });
  } catch {
    // Return safe defaults if DB is unavailable
    return NextResponse.json({ free: 0, pro: 29, enterprise: 99 });
  }
}
