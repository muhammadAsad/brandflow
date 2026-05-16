import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Public settings endpoint — no auth required.
 * Returns all client-facing system settings so the UI always reflects
 * whatever the admin has configured.  Uses the anon key; system_settings
 * has a public SELECT policy so no service-role key is needed.
 */
export const dynamic = 'force-dynamic';

const KEYS = [
  'allow_registrations',
  'require_email_verification',
  'free_plan_price',
  'pro_plan_price',
  'enterprise_plan_price',
  'max_free_posts',
  'max_pro_posts',
  'max_enterprise_posts',
  'max_free_contacts',
  'max_pro_contacts',
  'max_enterprise_contacts',
];

const DEFAULTS = {
  allow_registrations:       true,
  require_email_verification: true,
  free_plan_price:           0,
  pro_plan_price:            29,
  enterprise_plan_price:     99,
  max_free_posts:            10,
  max_pro_posts:             500,
  max_enterprise_posts:      -1,
  max_free_contacts:         100,
  max_pro_contacts:          5000,
  max_enterprise_contacts:   -1,
};

export async function GET() {
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data } = await db
      .from('system_settings')
      .select('key, value')
      .in('key', KEYS);

    const result: Record<string, unknown> = { ...DEFAULTS };
    for (const row of data ?? []) {
      result[row.key] = row.value;
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(DEFAULTS);
  }
}
