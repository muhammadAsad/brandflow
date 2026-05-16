'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell, Search, ChevronDown, Calendar, AlertCircle,
  TrendingUp, MessageCircle, Award, LogOut, Settings,
  User, X, Users, FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SearchResult {
  type: 'contact' | 'post' | 'page';
  label: string;
  sub: string;
  href: string;
}

// ── Quick nav pages ────────────────────────────────────────────────────────────

const QUICK_PAGES: SearchResult[] = [
  { type: 'page', label: 'Dashboard',      sub: 'Main overview',         href: '/'              },
  { type: 'page', label: 'Social Planner', sub: 'Schedule posts',        href: '/planner'       },
  { type: 'page', label: 'Campaigns',      sub: 'Manage campaigns',      href: '/campaigns'     },
  { type: 'page', label: 'CRM Contacts',   sub: 'Manage contacts',       href: '/crm'           },
  { type: 'page', label: 'Analytics',      sub: 'View analytics',        href: '/analytics'     },
  { type: 'page', label: 'Conversations',  sub: 'Unified inbox',         href: '/conversations' },
  { type: 'page', label: 'Integrations',   sub: 'Connect apps',          href: '/integrations'  },
  { type: 'page', label: 'Settings',       sub: 'Account settings',      href: '/settings'      },
  { type: 'page', label: 'Notifications',  sub: 'All notifications',     href: '/notifications' },
];

const DATE_PRESETS = [
  { label: 'Today'        },
  { label: 'Last 7 days'  },
  { label: 'Last 30 days' },
  { label: 'Last 3 months'},
];

// ── Header ─────────────────────────────────────────────────────────────────────

export function Header() {
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [search,         setSearch]         = useState('');
  const [searchFocused,  setSearchFocused]  = useState(false);
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [dateOpen,       setDateOpen]       = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Last 7 days');
  const [customStart,    setCustomStart]    = useState('');
  const [customEnd,      setCustomEnd]      = useState('');

  const { user, signOut } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const profileRef     = useRef<HTMLDivElement>(null);
  const notifRef       = useRef<HTMLDivElement>(null);
  const searchRef      = useRef<HTMLDivElement>(null);
  const dateRef        = useRef<HTMLDivElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // ── Close all dropdowns on route change ───────────────────────────────────
  useEffect(() => {
    setNotifOpen(false);
    setProfileOpen(false);
    setSearchFocused(false);
    setDateOpen(false);
  }, [pathname]);

  // ── Outside-click handler for all dropdowns ────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setNotifOpen(false);
      if (searchRef.current  && !searchRef.current.contains(e.target as Node))  setSearchFocused(false);
      if (dateRef.current    && !dateRef.current.contains(e.target as Node))    setDateOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(search.trim());
        const term = search.trim().toLowerCase();

        const [cr, pr] = await Promise.all([
          fetch(`/api/contacts?search=${q}`),
          fetch('/api/social/posts'),
        ]);
        const cd = cr.ok ? await cr.json() : { contacts: [] };
        const pd = pr.ok ? await pr.json() : { posts: [] };

        const results: SearchResult[] = [
          // Quick-nav pages matching the query
          ...QUICK_PAGES.filter(p =>
            p.label.toLowerCase().includes(term) || p.sub.toLowerCase().includes(term)
          ).slice(0, 2),
          // Contacts
          ...(cd.contacts ?? []).slice(0, 3).map((c: { full_name?: string; name?: string; email?: string; company?: string }) => ({
            type: 'contact' as const,
            label: c.full_name || c.name || 'Contact',
            sub:   c.email || c.company || 'Contact',
            href:  '/crm',
          })),
          // Posts
          ...(pd.posts ?? [])
            .filter((p: { content?: string }) => p.content?.toLowerCase().includes(term))
            .slice(0, 3)
            .map((p: { content: string; status: string }) => ({
              type: 'post' as const,
              label: p.content.slice(0, 55) + (p.content.length > 55 ? '…' : ''),
              sub:   'Post · ' + p.status,
              href:  '/planner',
            })),
        ];
        setSearchResults(results);
      } catch { setSearchResults([]); }
      finally   { setSearchLoading(false); }
    }, 280);
  }, [search]);

  const dateLabel = customStart && customEnd
    ? `${customStart} – ${customEnd}`
    : selectedPreset;

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push('/login');
  };

  const handleSearchNav = (href: string) => {
    setSearch('');
    setSearchFocused(false);
    router.push(href);
  };

  const showSearchDrop = searchFocused;

  return (
    <div style={{
      background: '#fff', borderBottom: '1px solid #ede9fe',
      padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
      position: 'relative', zIndex: 50,
    }}>

      {/* Greeting */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          Good morning, <span style={{ color: '#7c3aed', fontWeight: 700 }}>{user?.full_name?.split(' ')[0] ?? 'there'} 👋</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
          Let&apos;s grow your brand, <span style={{ color: '#7c3aed' }}>smarter.</span>
        </h1>
      </div>

      {/* ── Search ────────────────────────────────────────────────────────── */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: searchFocused ? '#fff' : '#f8f7ff',
          border: `1.5px solid ${searchFocused ? '#7c3aed' : '#ede9fe'}`,
          borderRadius: 12, padding: '7px 14px', width: 240,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: searchFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}>
          <Search size={14} color={searchFocused ? '#7c3aed' : '#94a3b8'} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search anything..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', flex: 1 }}
          />
          {search ? (
            <button onClick={() => { setSearch(''); setSearchResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}>
              <X size={13} />
            </button>
          ) : (
            <kbd style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 10, padding: '2px 5px', borderRadius: 4, fontWeight: 600 }}>⌘K</kbd>
          )}
        </div>

        {/* Results / quick-nav dropdown */}
        {showSearchDrop && (
          <div style={{
            position: 'absolute', top: 46, left: 0, width: 340,
            background: '#fff', borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #ede9fe', overflow: 'hidden', zIndex: 300,
          }}>
            {!search.trim() ? (
              /* No query — show quick navigation */
              <>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Quick Navigation
                </div>
                {QUICK_PAGES.slice(0, 6).map(p => (
                  <button key={p.href} onClick={() => handleSearchNav(p.href)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8f7ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={13} color="#7c3aed" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.sub}</div>
                    </div>
                  </button>
                ))}
              </>
            ) : searchLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Searching…</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                No results for &ldquo;{search}&rdquo;
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Results
                </div>
                {searchResults.map((r, i) => (
                  <button key={i} onClick={() => handleSearchNav(r.href)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8f7ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: r.type === 'contact' ? '#e0f2fe' : r.type === 'post' ? '#fce7f3' : '#f5f3ff',
                    }}>
                      {r.type === 'contact' ? <Users size={13} color="#0ea5e9" /> : r.type === 'post' ? <FileText size={13} color="#ec4899" /> : <FileText size={13} color="#7c3aed" />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.sub}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Date range picker ─────────────────────────────────────────────── */}
      <div ref={dateRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDateOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: dateOpen ? '#fff' : '#f8f7ff',
            border: `1.5px solid ${dateOpen ? '#7c3aed' : '#ede9fe'}`,
            borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
            boxShadow: dateOpen ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
            transition: 'all 0.15s',
          }}
        >
          <Calendar size={13} color="#7c3aed" />
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{dateLabel}</span>
          <ChevronDown size={12} color="#94a3b8" style={{ transform: dateOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {dateOpen && (
          <div style={{
            position: 'absolute', top: 42, right: 0, width: 230,
            background: '#fff', borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid #ede9fe', overflow: 'hidden', zIndex: 300,
          }}>
            <div style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preset Ranges
            </div>
            {DATE_PRESETS.map(p => (
              <button key={p.label}
                onClick={() => { setSelectedPreset(p.label); setCustomStart(''); setCustomEnd(''); setDateOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, fontWeight: 500,
                  background: selectedPreset === p.label && !customStart ? 'rgba(124,58,237,0.06)' : 'none',
                  color:      selectedPreset === p.label && !customStart ? '#7c3aed' : '#374151',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = selectedPreset === p.label && !customStart ? 'rgba(124,58,237,0.06)' : 'none')}
              >
                {p.label}
                {selectedPreset === p.label && !customStart && <span style={{ fontSize: 12, color: '#7c3aed' }}>✓</span>}
              </button>
            ))}

            {/* Custom range */}
            <div style={{ borderTop: '1px solid #f1f0ff', padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Custom</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', fontSize: 12, outline: 'none', color: '#374151', width: '100%', boxSizing: 'border-box' }} />
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', fontSize: 12, outline: 'none', color: '#374151', width: '100%', boxSizing: 'border-box' }} />
              </div>
              {customStart && customEnd && (
                <button onClick={() => { setSelectedPreset('Custom'); setDateOpen(false); }}
                  style={{ width: '100%', marginTop: 8, padding: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

        {/* Notifications — wrapped in a ref div so outside-click works */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
            style={{
              position: 'relative', background: '#f8f7ff', border: '1.5px solid #ede9fe',
              borderRadius: 10, width: 38, height: 38, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bell size={16} color="#475569" />
            <div style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', border: '1.5px solid #fff' }} />
          </button>

          {notifOpen && (
            <div style={{
              position: 'absolute', top: 46, right: 0, width: 300, background: '#fff',
              borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 300,
              border: '1px solid #ede9fe', overflow: 'hidden',
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f0ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>Notifications</span>
                <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>3 new</span>
              </div>
              {[
                { icon: TrendingUp,    color: '#10b981', text: 'Instagram reached 1M impressions!', time: '5m ago'  },
                { icon: MessageCircle, color: '#0ea5e9', text: '12 new messages waiting',           time: '12m ago' },
                { icon: Award,         color: '#f59e0b', text: "Campaign 'Summer Sale' is live",    time: '1h ago'  },
              ].map((n, i) => (
                <div key={i}
                  style={{ padding: '12px 16px', display: 'flex', gap: 10, borderBottom: '1px solid #f8f7ff', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f7ff')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
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
                <button
                  onClick={() => { setNotifOpen(false); router.push('/notifications'); }}
                  style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        <button style={{
          background: '#f8f7ff', border: '1.5px solid #ede9fe',
          borderRadius: 10, width: 38, height: 38, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlertCircle size={16} color="#475569" />
        </button>

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }}
            style={{
              width: 38, height: 38, borderRadius: 10, background: '#7c3aed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              border: profileOpen ? '2px solid #5b21b6' : '2px solid transparent',
              outline: 'none',
              boxShadow: profileOpen ? '0 0 0 3px rgba(124,58,237,0.2)' : 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</span>
          </button>

          {profileOpen && (
            <div style={{
              position: 'absolute', top: 46, right: 0, width: 230,
              background: '#fff', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              border: '1px solid #ede9fe', overflow: 'hidden', zIndex: 300,
            }}>
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

              <div style={{ padding: '6px 0' }}>
                {[
                  { icon: User,     label: 'Profile',  href: '/settings' },
                  { icon: Settings, label: 'Settings', href: '/settings' },
                ].map(item => (
                  <button key={item.label}
                    onClick={() => { setProfileOpen(false); router.push(item.href); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#374151', textAlign: 'left' }}
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
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' }}
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
    </div>
  );
}
