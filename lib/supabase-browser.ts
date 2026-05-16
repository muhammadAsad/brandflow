import { createBrowserClient } from '@supabase/ssr';

/**
 * Returns a typed Supabase browser client.
 *
 * Falls back to placeholder strings if NEXT_PUBLIC_ vars are not yet
 * available (e.g. during Next.js build-time pre-rendering on the server).
 * At runtime in the browser the real values are always baked in by the
 * Next.js compiler, so the placeholder branch is never reached in production.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  );
}
