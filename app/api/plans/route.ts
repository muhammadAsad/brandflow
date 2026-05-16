import { createAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

/**
 * Public endpoint — no auth required.
 * Returns the current plan prices as set by the admin in system_settings.
 * The upgrade page reads these so price changes in the admin panel are
 * instantly reflected on the client without any code changes.
 */
export const revalidate = 60; // cache for 60 s, then re-fetch

export async function GET() {
  try {
    const db = createAdminClient();
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
