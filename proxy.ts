import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let supabaseResponse = NextResponse.next({ request });

  const isAuthRoute      = ['/login', '/register', '/forgot-password', '/reset-password', '/admin-access'].some(p => pathname.startsWith(p));
  const isAdminRoute     = pathname === '/admin' || pathname.startsWith('/admin/');
  const isMaintenancePage= pathname === '/maintenance';
  const isApiRoute       = pathname.startsWith('/api/');
  const isPublicAsset    = pathname.startsWith('/_next/') || pathname.startsWith('/favicon');

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // ── Maintenance mode ───────────────────────────────────────────────────────
    if (!isAdminRoute && !isMaintenancePage && !isAuthRoute && !isApiRoute && !isPublicAsset) {
      try {
        const { data: setting } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        const maintenanceOn = setting?.value === true || setting?.value === 'true';
        if (maintenanceOn) {
          if (user) {
            const { data: p } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
            if (!p?.is_admin) return NextResponse.redirect(new URL('/maintenance', request.url));
          } else {
            return NextResponse.redirect(new URL('/maintenance', request.url));
          }
        }
      } catch { /* table may not exist yet */ }
    }

    // ── Admin route protection ─────────────────────────────────────────────────
    if (isAdminRoute) {
      if (!user) return NextResponse.redirect(new URL('/admin-access', request.url));
      const { data: p } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
      if (!p?.is_admin) return NextResponse.redirect(new URL('/', request.url));
    }

    // ── Auth page redirect (logged-in users) ───────────────────────────────────
    if (isAuthRoute && user) {
      // Admin-access page: already-authenticated admins go straight to /admin
      if (pathname.startsWith('/admin-access')) {
        // Let the page's own useEffect handle the redirect (it checks is_admin client-side)
        // Just let them through — no server-side profile query needed here
        return supabaseResponse;
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    // ── Protected routes (require login) ──────────────────────────────────────
    const isProtected = !isAuthRoute && !isApiRoute && !isPublicAsset && !isAdminRoute && !isMaintenancePage;
    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch {
    // Supabase misconfigured — let the request through
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
