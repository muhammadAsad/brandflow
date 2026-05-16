'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Users, CreditCard, ToggleLeft, Tag,
  BarChart2, Activity, Megaphone, Settings, Shield,
  ArrowLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

// ── Nav structure ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, exact: true },
      { href: '/admin/users',         label: 'Users',         icon: Users },
    ],
  },
  {
    label: 'BILLING',
    items: [
      { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
      { href: '/admin/promo-codes',   label: 'Promo Codes',   icon: Tag },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/admin/feature-flags', label: 'Feature Flags', icon: ToggleLeft },
      { href: '/admin/analytics',     label: 'Analytics',     icon: BarChart2 },
      { href: '/admin/monitoring',    label: 'Monitoring',    icon: Activity },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/settings',      label: 'Settings',      icon: Settings },
      { href: '/admin/audit-log',     label: 'Audit Log',     icon: Shield },
    ],
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  adminName: string;
  adminEmail: string;
}

export function AdminShell({ children, adminName, adminEmail }: AdminShellProps) {
  const pathname = usePathname();
  const router   = useRouter();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin-access');
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'DM Sans','Segoe UI',sans-serif",
      background: '#0a0b14',
    }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div style={{
        width: 220, flexShrink: 0, background: '#0d0e1a',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#f1f5f9', letterSpacing: '-0.02em' }}>BrandFlow</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#ef4444', color: '#fff', letterSpacing: '0.05em' }}>ADMIN</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px' }}>
          {SECTIONS.map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: '0.1em', padding: '0 10px', marginBottom: 4 }}>
                {section.label}
              </div>
              {section.items.map(item => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 10px', borderRadius: 7, marginBottom: 1,
                        background: active ? 'rgba(139,92,246,0.18)' : 'transparent',
                        color: active ? '#a78bfa' : '#64748b',
                        borderLeft: active ? '2px solid #8b5cf6' : '2px solid transparent',
                        fontSize: 13, fontWeight: active ? 600 : 400,
                        transition: 'all 0.12s', cursor: 'pointer',
                      }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = '#94a3b8'; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.color = '#64748b'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <item.icon size={15} />
                        {item.label}
                      </div>
                      {active && <ChevronRight size={12} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 8px' }}>
          {/* Admin info */}
          <div style={{ padding: '8px 10px', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>
                  {adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminName}</div>
                <div style={{ fontSize: 10, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminEmail}</div>
              </div>
            </div>
          </div>
          {/* Back to App */}
          <Link href="/" style={{ textDecoration: 'none', display: 'block' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, color: '#475569', fontSize: 12, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <ArrowLeft size={13} /> Back to App
            </div>
          </Link>
          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 7, background: 'none', border: 'none',
              color: '#f87171', fontSize: 12, cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header bar */}
        <div style={{
          height: 52, background: '#0d0e1a', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', letterSpacing: '0.05em' }}>ADMIN PANEL</span>
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, color: '#ef4444' }}>RESTRICTED ACCESS</span>
          </div>
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 7, color: '#f87171', cursor: 'pointer', fontSize: 12 }}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#0a0b14' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
