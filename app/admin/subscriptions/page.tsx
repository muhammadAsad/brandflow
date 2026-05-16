'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, RefreshCw, Search, Download, ChevronDown,
  ExternalLink, AlertCircle, CheckCircle, Clock, XCircle, DollarSign, Users,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused';

interface Subscription {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  plan: 'pro' | 'enterprise';
  status: SubStatus;
  amount: number;           // cents
  interval: 'month' | 'year';
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_SUBS: Subscription[] = [
  { id:'s1', user_id:'u1', email:'john.doe@acme.com',       full_name:'John Doe',       plan:'enterprise', status:'active',   amount:9900, interval:'month', current_period_end: new Date(Date.now()+15*86400000).toISOString(), cancel_at_period_end:false, stripe_customer_id:'cus_abc1', stripe_subscription_id:'sub_abc1', created_at: new Date(Date.now()-120*86400000).toISOString() },
  { id:'s2', user_id:'u2', email:'sarah.wilson@acme.com',   full_name:'Sarah Wilson',   plan:'pro',        status:'active',   amount:2900, interval:'month', current_period_end: new Date(Date.now()+22*86400000).toISOString(), cancel_at_period_end:false, stripe_customer_id:'cus_abc2', stripe_subscription_id:'sub_abc2', created_at: new Date(Date.now()-60*86400000).toISOString() },
  { id:'s3', user_id:'u3', email:'mike.brown@startup.io',   full_name:'Mike Brown',     plan:'pro',        status:'trialing', amount:2900, interval:'month', current_period_end: new Date(Date.now()+7*86400000).toISOString(),  cancel_at_period_end:false, stripe_customer_id:'cus_abc3', stripe_subscription_id:'sub_abc3', created_at: new Date(Date.now()-7*86400000).toISOString() },
  { id:'s4', user_id:'u4', email:'emily.j@company.com',     full_name:'Emily Johnson',  plan:'pro',        status:'past_due', amount:2900, interval:'month', current_period_end: new Date(Date.now()-3*86400000).toISOString(),  cancel_at_period_end:false, stripe_customer_id:'cus_abc4', stripe_subscription_id:'sub_abc4', created_at: new Date(Date.now()-90*86400000).toISOString() },
  { id:'s5', user_id:'u5', email:'david.lee@example.com',   full_name:'David Lee',      plan:'enterprise', status:'active',   amount:9900, interval:'month', current_period_end: new Date(Date.now()+8*86400000).toISOString(),  cancel_at_period_end:true,  stripe_customer_id:'cus_abc5', stripe_subscription_id:'sub_abc5', created_at: new Date(Date.now()-45*86400000).toISOString() },
  { id:'s6', user_id:'u6', email:'alice.m@brand.co',        full_name:'Alice Martin',   plan:'pro',        status:'canceled', amount:2900, interval:'month', current_period_end: new Date(Date.now()-10*86400000).toISOString(), cancel_at_period_end:true,  stripe_customer_id:'cus_abc6', stripe_subscription_id:'sub_abc6', created_at: new Date(Date.now()-200*86400000).toISOString() },
  { id:'s7', user_id:'u7', email:'carlos.r@agency.io',      full_name:'Carlos Rodriguez',plan:'enterprise',status:'active',   amount:99000,interval:'year', current_period_end: new Date(Date.now()+200*86400000).toISOString(),cancel_at_period_end:false, stripe_customer_id:'cus_abc7', stripe_subscription_id:'sub_abc7', created_at: new Date(Date.now()-30*86400000).toISOString() },
  { id:'s8', user_id:'u8', email:'nina.s@marketing.com',    full_name:'Nina Shaw',      plan:'pro',        status:'active',   amount:29000, interval:'year', current_period_end: new Date(Date.now()+180*86400000).toISOString(),cancel_at_period_end:false, stripe_customer_id:'cus_abc8', stripe_subscription_id:'sub_abc8', created_at: new Date(Date.now()-14*86400000).toISOString() },
];

// ── Status meta ───────────────────────────────────────────────────────────────

const STATUS_META: Record<SubStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  active:   { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle  size={12} color="#22c55e" />, label: 'Active' },
  trialing: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  icon: <Clock        size={12} color="#60a5fa" />, label: 'Trialing' },
  past_due: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <AlertCircle  size={12} color="#ef4444" />, label: 'Past Due' },
  canceled: { color: '#475569', bg: 'rgba(71,85,105,0.15)',  icon: <XCircle      size={12} color="#475569" />, label: 'Canceled' },
  paused:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <Clock        size={12} color="#f59e0b" />, label: 'Paused' },
};

const PLAN_META: Record<string, { color: string; bg: string }> = {
  pro:        { color: '#a78bfa', bg: 'rgba(139,92,246,0.15)' },
  enterprise: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmount(cents: number, interval: string) {
  const d = cents / 100;
  const sym = d >= 100 ? `$${d.toLocaleString()}` : `$${d}`;
  return `${sym}/${interval === 'year' ? 'yr' : 'mo'}`;
}

function dateStr(iso: string) { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function daysUntil(iso: string) {
  const d = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (d < 0)  return <span style={{ color: '#ef4444' }}>{Math.abs(d)}d overdue</span>;
  if (d < 7)  return <span style={{ color: '#f59e0b' }}>in {d}d</span>;
  return <span style={{ color: '#64748b' }}>in {d}d</span>;
}

function calcMRR(subs: Subscription[]) {
  return subs
    .filter(s => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => {
      const monthly = s.interval === 'year' ? s.amount / 12 : s.amount;
      return sum + monthly;
    }, 0) / 100;
}

function initials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#7c3aed', '#0369a1', '#059669', '#d97706', '#dc2626', '#0891b2'];
function avatarColor(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff; return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]; }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [subs, setSubs]       = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [plan, setPlan]       = useState('all');
  const [status, setStatus]   = useState('all');
  const [sort, setSort]       = useState('newest');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ search, plan, status, sort });
      const res = await fetch(`/api/admin/subscriptions?${p}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSubs(json.subscriptions?.length ? json.subscriptions : DEMO_SUBS);
    } catch {
      setSubs(DEMO_SUBS);
    } finally { setLoading(false); }
  }, [search, plan, status, sort]);

  useEffect(() => { load(); }, [plan, status, sort]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  // Client-side filter for demo data
  const filtered = subs.filter(s => {
    const matchSearch = !search || s.email.toLowerCase().includes(search.toLowerCase()) || (s.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchPlan   = plan   === 'all' || s.plan   === plan;
    const matchStatus = status === 'all' || s.status === status;
    return matchSearch && matchPlan && matchStatus;
  }).sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'amount') return b.amount - a.amount;
    return 0;
  });

  const mrr        = calcMRR(subs);
  const activeCount = subs.filter(s => s.status === 'active').length;
  const trialCount  = subs.filter(s => s.status === 'trialing').length;
  const pastDueCount= subs.filter(s => s.status === 'past_due').length;

  function exportCSV() {
    const rows = [['Email', 'Name', 'Plan', 'Status', 'Amount', 'Interval', 'Period End', 'Stripe ID']].concat(
      filtered.map(s => [s.email, s.full_name ?? '', s.plan, s.status, fmtAmount(s.amount, s.interval), s.interval, dateStr(s.current_period_end), s.stripe_subscription_id ?? ''])
    );
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'subscriptions.csv'; a.click();
  }

  return (
    <div style={{ padding: '28px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Subscriptions</h1>
          <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 0' }}>{subs.length} total subscriptions</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={load} style={{ padding: '8px 12px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        {[
          { icon: <DollarSign size={16} color="#fbbf24" />, label: 'Est. MRR',    value: `$${mrr.toLocaleString(undefined, { minimumFractionDigits: 0 })}`, color: '#fbbf24' },
          { icon: <CheckCircle size={16} color="#22c55e" />, label: 'Active',     value: activeCount,   color: '#22c55e' },
          { icon: <Clock size={16} color="#60a5fa" />,       label: 'Trialing',   value: trialCount,    color: '#60a5fa' },
          { icon: <AlertCircle size={16} color="#ef4444" />, label: 'Past Due',   value: pastDueCount,  color: '#ef4444' },
          { icon: <Users size={16} color="#8b5cf6" />,       label: 'Total',      value: subs.length,   color: '#8b5cf6' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: kpi.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{kpi.icon}</div>
              <span style={{ fontSize: 11, color: '#64748b' }}>{kpi.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={13} color="#334155" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px 9px 32px', background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
        </div>
        {[
          { val: plan, set: setPlan, opts: [{ v: 'all', l: 'All Plans' }, { v: 'pro', l: 'Pro' }, { v: 'enterprise', l: 'Enterprise' }] },
          { val: status, set: setStatus, opts: [{ v: 'all', l: 'All Status' }, { v: 'active', l: 'Active' }, { v: 'trialing', l: 'Trialing' }, { v: 'past_due', l: 'Past Due' }, { v: 'canceled', l: 'Canceled' }] },
          { val: sort, set: setSort, opts: [{ v: 'newest', l: 'Newest' }, { v: 'oldest', l: 'Oldest' }, { v: 'amount', l: 'Amount ↓' }] },
        ].map((f, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <select value={f.val} onChange={e => f.set(e.target.value)}
              style={{ appearance: 'none', padding: '9px 28px 9px 12px', background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
              {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <ChevronDown size={11} color="#334155" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Customer', 'Plan', 'Status', 'Amount', 'Renews / Ends', 'Created', 'Stripe'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#334155' }}>Loading subscriptions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#334155' }}>No subscriptions found</td></tr>
            ) : filtered.map(sub => {
              const sm = STATUS_META[sub.status];
              const pm = PLAN_META[sub.plan];
              return (
                <tr key={sub.id}
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'none'; }}>

                  {/* Customer */}
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(sub.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {initials(sub.full_name, sub.email)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 13 }}>{sub.full_name || sub.email}</div>
                        <div style={{ fontSize: 11, color: '#334155' }}>{sub.full_name ? sub.email : ''}</div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: pm.bg, color: pm.color, textTransform: 'capitalize' }}>
                      {sub.plan}
                    </span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sm.bg, color: sm.color, width: 'fit-content' }}>
                        {sm.icon} {sm.label}
                      </span>
                      {sub.cancel_at_period_end && sub.status !== 'canceled' && (
                        <span style={{ fontSize: 10, color: '#f59e0b' }}>Cancels at period end</span>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '11px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#e2e8f0', fontSize: 13 }}>
                    {fmtAmount(sub.amount, sub.interval)}
                  </td>

                  {/* Renews */}
                  <td style={{ padding: '11px 16px', fontSize: 12 }}>
                    <div style={{ color: '#64748b' }}>{dateStr(sub.current_period_end)}</div>
                    <div style={{ fontSize: 11, marginTop: 1 }}>{daysUntil(sub.current_period_end)}</div>
                  </td>

                  {/* Created */}
                  <td style={{ padding: '11px 16px', color: '#475569', fontSize: 12 }}>
                    {dateStr(sub.created_at)}
                  </td>

                  {/* Stripe link */}
                  <td style={{ padding: '11px 16px' }}>
                    {sub.stripe_subscription_id ? (
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748b', textDecoration: 'none', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#a78bfa'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#64748b'; }}
                      >
                        <CreditCard size={11} /> Stripe <ExternalLink size={9} />
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: '#1e293b' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
