'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, ChevronDown, Calendar, AlertCircle, TrendingUp, MessageCircle, Award, LogOut, Settings, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const [notifOpen, setNotifOpen]     = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch]           = useState('');
  const { user, signOut }             = useAuth();
  const router                        = useRouter();
  const profileRef                    = useRef<HTMLDivElement>(null);

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push('/login');
  };

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #ede9fe',
      padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      position: 'relative', zIndex: 50,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Good morning, <span style={{ color: '#7c3aed', fontWeight: 700 }}>{user?.full_name?.split(' ')[0] ?? 'there'} 👋</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          Let&apos;s grow your brand, <span style={{ color: '#7c3aed' }}>smarter.</span>
        </h1>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f7ff', border: '1.5px solid #ede9fe', borderRadius: 12, padding: '7px 14px', width: 240 }}>
        <Search size={14} color="#94a3b8" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search anything..."
          style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', flex: 1 }}
        />
        <kbd style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 10, padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>⌘K</kbd>
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8f7ff', border: '1.5px solid #ede9fe', borderRadius: 10, padding: '6px 12px', cursor: 'pointer' }}>
        <Calendar size={13} color="#7c3aed" />
        <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>May 12 – May 18, 2024</span>
        <ChevronDown size={12} color="#94a3b8" />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Notifications */}
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          style={{
            position: 'relative', background: '#f8f7ff', border: '1.5px solid #ede9fe',
            borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Bell size={16} color="#475569" />
          <div style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', border: '1.5px solid #fff' }} />
        </button>
        <button style={{
          background: '#f8f7ff', border: '1.5px solid #ede9fe',
          borderRadius: 10, width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={16} color="#475569" />
        </button>

        {/* Profile avatar + dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            style={{
              width: 38, height: 38, borderRadius: 10, background: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: profileOpen ? '2px solid #5b21b6' : '2px solid transparent',
              outline: 'none', boxShadow: profileOpen ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</span>
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 46, right: 0, width: 230,
              background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              border: '1px solid #ede9fe', overflow: 'hidden', zIndex: 200,
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f0ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.full_name || 'User'}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 10, background: '#ede9fe', color: '#7c3aed' }}>
                    {user?.plan || 'Free'} Plan
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                {[
                  { icon: User,     label: 'Profile',  href: '/settings' },
                  { icon: Settings, label: 'Settings', href: '/settings' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setProfileOpen(false); router.push(item.href); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, color: '#374151', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8f7ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <item.icon size={15} color="#7c3aed" />
                    {item.label}
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #f1f0ff', padding: '6px 0' }}>
                <button
                  onClick={handleSignOut}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, color: '#ef4444', textAlign: 'left',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={15} color="#ef4444" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification panel */}
      {notifOpen && (
        <div style={{
          position: 'absolute', top: 70, right: 92, width: 300, background: '#fff',
          borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 100,
          border: '1px solid #ede9fe', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f0ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Notifications</span>
            <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>3 new</span>
          </div>
          {[
            { icon: TrendingUp,    color: '#10b981', text: 'Instagram reached 1M impressions!', time: '5m ago' },
            { icon: MessageCircle, color: '#0ea5e9', text: '12 new messages waiting',           time: '12m ago' },
            { icon: Award,         color: '#f59e0b', text: "Campaign 'Summer Sale' is live",    time: '1h ago' },
          ].map((n, i) => (
            <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: 10, borderBottom: '1px solid #f8f7ff', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: n.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <n.icon size={15} color={n.color} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, color: '#1e293b', fontWeight: 500 }}>{n.text}</p>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{n.time}</p>
              </div>
            </div>
          ))}
          <div style={{ padding: 12, textAlign: 'center' }}>
            <button style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
