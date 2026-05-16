'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Calendar, Send, MessageCircle, Database,
  BarChart2, Zap, Link2, Settings, ChevronDown, Flame,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
  { icon: LayoutDashboard, label: 'Command Center', href: '/' },
  { icon: Users,           label: 'Audience',       href: '/audience' },
  { icon: Calendar,        label: 'Social Planner',  href: '/planner' },
  { icon: Send,            label: 'Campaigns',       href: '/campaigns' },
  { icon: MessageCircle,   label: 'Conversations',   href: '/conversations', badge: 12 },
  { icon: Database,        label: 'CRM',             href: '/crm' },
  { icon: BarChart2,       label: 'Analytics',       href: '/analytics' },
  { icon: Zap,             label: 'Automation',      href: '/automation' },
  { icon: Link2,           label: 'Integrations',    href: '/integrations' },
  { icon: Settings,        label: 'Settings',        href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = (user?.full_name ?? 'Arjun Mehta')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: 220, background: '#0d0f1c', flexShrink: 0,
      display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Flame size={18} color="#fff" />
        </div>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>BrandFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 12px' }}>
        {NAV.map(({ icon: Icon, label, href, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                background: active ? 'linear-gradient(135deg, #7c3aed22, #a855f722)' : 'transparent',
                marginBottom: 2, position: 'relative',
                borderLeft: active ? '3px solid #a855f7' : '3px solid transparent',
                transition: 'all 0.15s',
              }}>
                <Icon size={17} color={active ? '#a78bfa' : '#64748b'} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? '#e2d9f3' : '#64748b' }}>
                  {label}
                </span>
                {badge && (
                  <span style={{ background: '#7c3aed', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                    {badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Plan card */}
      <div style={{ margin: '12px 14px', borderRadius: 14, background: 'linear-gradient(135deg, #1e1b4b, #312e81)', padding: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -10, bottom: -10, width: 70, height: 70, borderRadius: '50%', background: 'rgba(124,58,237,0.3)' }} />
        <div style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Pro Plan</div>
        <div style={{ color: 'rgba(196,181,253,0.7)', fontSize: 11, marginBottom: 12 }}>Renews in 24 days</div>
        <button style={{
          width: '100%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: 'none', color: '#fff', borderRadius: 10, padding: '7px 0',
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>Upgrade Plan →</button>
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px 20px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: '#7c3aed20', color: '#a78bfa', fontWeight: 600,
          fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #7c3aed30', flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e2d9f3', fontSize: 13, fontWeight: 600 }}>{user?.full_name ?? 'Arjun Mehta'}</div>
          <div style={{ color: '#64748b', fontSize: 11 }}>Admin</div>
        </div>
        <ChevronDown size={14} color="#64748b" />
      </div>
    </div>
  );
}
