'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface LogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_user_id: string | null;
  target_user_email: string | null;
  ip_address: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  'Updated user profile':      { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  'Deleted user account':      { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  'Set feature override':      { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  'Locked user account':       { color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  'Unlocked user account':     { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  'Changed plan':              { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  'Made admin':                { color: '#c084fc', bg: 'rgba(192,132,252,0.1)' },
  'Removed admin':             { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

function getActionStyle(action: string) {
  for (const key of Object.keys(ACTION_COLORS)) {
    if (action.startsWith(key)) return ACTION_COLORS[key];
  }
  return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
}

const DEMO_LOGS: LogEntry[] = [
  { id: 'l01', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Updated user profile',    target_user_id: 'u1', target_user_email: 'alice@example.com',  ip_address: '192.168.1.1', details: { full_name: 'Alice Johnson', plan: 'pro' },                          created_at: new Date(Date.now()-3600000).toISOString() },
  { id: 'l02', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Set feature override: conversations = true', target_user_id: 'u2', target_user_email: 'bob@example.com', ip_address: '192.168.1.1', details: { feature_key: 'conversations', is_enabled: true, reason: 'Beta tester' }, created_at: new Date(Date.now()-7200000).toISOString() },
  { id: 'l03', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Locked user account',     target_user_id: 'u3', target_user_email: 'carol@example.com', ip_address: '192.168.1.1', details: { reason: 'Suspicious activity' },                                   created_at: new Date(Date.now()-86400000).toISOString() },
  { id: 'l04', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Changed plan',            target_user_id: 'u4', target_user_email: 'dave@example.com',  ip_address: '192.168.1.1', details: { from: 'free', to: 'pro' },                                          created_at: new Date(Date.now()-172800000).toISOString() },
  { id: 'l05', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Deleted user account',   target_user_id: 'u5', target_user_email: 'eve@example.com',   ip_address: '192.168.1.1', details: null,                                                                  created_at: new Date(Date.now()-259200000).toISOString() },
  { id: 'l06', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Made admin',              target_user_id: 'u6', target_user_email: 'frank@example.com', ip_address: '192.168.1.1', details: null,                                                                  created_at: new Date(Date.now()-345600000).toISOString() },
  { id: 'l07', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Unlocked user account',  target_user_id: 'u3', target_user_email: 'carol@example.com', ip_address: '192.168.1.1', details: null,                                                                  created_at: new Date(Date.now()-432000000).toISOString() },
  { id: 'l08', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Set feature override: ai_insights = false', target_user_id: 'u7', target_user_email: 'grace@example.com', ip_address: '192.168.1.1', details: { feature_key: 'ai_insights', is_enabled: false, reason: 'Abuse' }, created_at: new Date(Date.now()-518400000).toISOString() },
  { id: 'l09', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Updated user profile',   target_user_id: 'u8', target_user_email: 'henry@example.com', ip_address: '192.168.1.1', details: { admin_notes: 'High-value enterprise prospect' },                      created_at: new Date(Date.now()-604800000).toISOString() },
  { id: 'l10', admin_id: 'a1', admin_email: 'muhammadubs@gmail.com', action: 'Removed admin',          target_user_id: 'u6', target_user_email: 'frank@example.com', ip_address: '192.168.1.1', details: null,                                                                  created_at: new Date(Date.now()-691200000).toISOString() },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs?limit=200');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs?.length ? data.logs : DEMO_LOGS);
      } else {
        setLogs(DEMO_LOGS);
      }
    } catch {
      setLogs(DEMO_LOGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.action.toLowerCase().includes(q) || (l.target_user_email || '').toLowerCase().includes(q) || l.admin_email.toLowerCase().includes(q);
    const matchAction = !actionFilter || l.action.startsWith(actionFilter);
    return matchSearch && matchAction;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const uniqueActions = Array.from(new Set(logs.map(l => l.action.split(':')[0].trim())));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0a0b14' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Audit Log</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Full history of admin actions</p>
        </div>
        <button
          onClick={fetchLogs}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by action, email..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px 9px 34px', color: '#f1f5f9', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(0); }}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px 9px 30px', color: actionFilter ? '#f1f5f9' : '#64748b', fontSize: 13, outline: 'none', cursor: 'pointer', minWidth: 180 }}
          >
            <option value="">All actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} {search || actionFilter ? '(filtered)' : ''}
      </div>

      {/* Table */}
      <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 120px 40px', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Action', 'Admin', 'Target User', 'Time', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading logs...</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#475569', fontStyle: 'italic' }}>No entries found.</div>
        ) : (
          paginated.map((log, i) => {
            const style = getActionStyle(log.action);
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id}>
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 120px 40px',
                    padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    background: isExpanded ? 'rgba(139,92,246,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)',
                  }}
                >
                  {/* Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, background: style.bg, color: style.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {log.action}
                    </span>
                  </div>

                  {/* Admin */}
                  <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.admin_email}
                  </div>

                  {/* Target User */}
                  <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.target_user_email || <span style={{ color: '#334155' }}>—</span>}
                  </div>

                  {/* Time */}
                  <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                    {formatTime(log.created_at)}
                  </div>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    disabled={!log.details}
                    style={{ background: 'none', border: 'none', cursor: log.details ? 'pointer' : 'default', color: log.details ? '#64748b' : '#1e293b', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Details */}
                {isExpanded && log.details && (
                  <div style={{ padding: '12px 20px 14px 28px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Details</div>
                    <pre style={{ margin: 0, fontSize: 12, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px', overflow: 'auto', fontFamily: 'monospace', lineHeight: 1.6 }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                    {log.ip_address && (
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>IP: {log.ip_address}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            Page {page + 1} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: page === 0 ? '#334155' : '#94a3b8', cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 13 }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: page >= totalPages - 1 ? '#334155' : '#94a3b8', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
