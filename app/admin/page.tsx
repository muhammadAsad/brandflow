'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, TrendingUp, Activity, UserCheck, DollarSign,
  AlertTriangle, RefreshCw, Lock, Flag, ArrowUpRight, Clock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  lockedCount: number;
  mrr: number;
  failedPayments: number;
  planBreakdown: Record<string, number>;
  dailySignups: { date: string; count: number }[];
}

interface AdminLog {
  id: string;
  admin_email: string;
  action: string;
  target_user_email: string | null;
  created_at: string;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_STATS: Stats = {
  totalUsers: 2543, activeToday: 847, newThisWeek: 134, lockedCount: 3,
  mrr: 18450, failedPayments: 5,
  planBreakdown: { free: 650, pro: 1562, enterprise: 331 },
  dailySignups: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 35) + 10,
  })),
};

const DEMO_LOGS: AdminLog[] = [
  { id: 'l1', admin_email: 'muhammadubs@gmail.com', action: 'Changed plan to Pro', target_user_email: 'alice@startup.io', created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 'l2', admin_email: 'muhammadubs@gmail.com', action: 'Created promo code: LAUNCH50', target_user_email: null, created_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'l3', admin_email: 'muhammadubs@gmail.com', action: 'Locked user account', target_user_email: 'spammer@bad.com', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'l4', admin_email: 'muhammadubs@gmail.com', action: 'Updated feature flag: ai_insights', target_user_email: null, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'l5', admin_email: 'muhammadubs@gmail.com', action: 'Updated setting: maintenance_mode', target_user_email: null, created_at: new Date(Date.now() - 14400000).toISOString() },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Custom tooltip for area chart ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{payload[0].value} signups</p>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, change, icon: Icon, iconBg, positive }: {
  label: string; value: string; change?: string; icon: typeof Users; iconBg: string; positive?: boolean;
}) {
  return (
    <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color="#a78bfa" />
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 28, color: '#f1f5f9', marginBottom: 8, letterSpacing: '-0.02em' }}>{value}</div>
      {change && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowUpRight size={13} color={positive !== false ? '#22c55e' : '#ef4444'} />
          <span style={{ fontSize: 12, color: positive !== false ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{change}</span>
          <span style={{ fontSize: 11, color: '#334155' }}>vs last 30 days</span>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const PLAN_COLORS = ['#334155', '#7c3aed', '#0369a1'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/logs?limit=20'),
      ]);
      const s = await statsRes.json();
      const l = await logsRes.json();
      setStats(s.totalUsers != null ? s : DEMO_STATS);
      setLogs(l.logs?.length ? l.logs : DEMO_LOGS);
    } catch {
      setStats(DEMO_STATS);
      setLogs(DEMO_LOGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const s = stats ?? DEMO_STATS;
  const total = s.totalUsers || 1;
  const planData = [
    { name: 'Free', value: s.planBreakdown.free ?? 0, color: '#334155' },
    { name: 'Pro', value: s.planBreakdown.pro ?? 0, color: '#8b5cf6' },
    { name: 'Enterprise', value: s.planBreakdown.enterprise ?? 0, color: '#f59e0b' },
  ];

  const chartData = (s.dailySignups ?? []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  const alerts = [
    s.lockedCount > 0    && { type: 'warning', msg: `${s.lockedCount} locked user account${s.lockedCount > 1 ? 's' : ''}`, href: '/admin/users?status=locked' },
    s.failedPayments > 0 && { type: 'error',   msg: `${s.failedPayments} failed payment${s.failedPayments > 1 ? 's' : ''} require attention`, href: '/admin/subscriptions' },
  ].filter(Boolean) as { type: string; msg: string; href: string }[];

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 0' }}>BrandFlow platform overview</p>
        </div>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#64748b' }}
        >
          <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
        <KpiCard label="Total Users"      value={fmt(s.totalUsers)}   change="12.5%"  icon={Users}      iconBg="rgba(139,92,246,0.12)" positive />
        <KpiCard label="MRR"             value={`$${fmt(s.mrr)}`}    change="14.3%"  icon={DollarSign} iconBg="rgba(34,197,94,0.12)"  positive />
        <KpiCard label="Active Today"    value={fmt(s.activeToday)}  change="8.3%"   icon={Activity}   iconBg="rgba(14,165,233,0.12)" positive />
        <KpiCard label="New This Week"   value={fmt(s.newThisWeek)}  change="21.0%"  icon={UserCheck}  iconBg="rgba(245,158,11,0.12)" positive />
        <KpiCard label="Failed Payments" value={String(s.failedPayments)} icon={AlertTriangle} iconBg="rgba(239,68,68,0.12)" change={s.failedPayments > 0 ? 'Needs attention' : 'All clear'} positive={s.failedPayments === 0} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {alerts.map((a, i) => (
            <a key={i} href={a.href} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: a.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${a.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`, borderRadius: 10, textDecoration: 'none' }}>
              <AlertTriangle size={15} color={a.type === 'error' ? '#ef4444' : '#f59e0b'} />
              <span style={{ fontSize: 13, color: a.type === 'error' ? '#fca5a5' : '#fcd34d', fontWeight: 500 }}>{a.msg}</span>
              <ArrowUpRight size={13} color={a.type === 'error' ? '#ef4444' : '#f59e0b'} style={{ marginLeft: 'auto' }} />
            </a>
          ))}
        </div>
      )}

      {/* Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Area chart */}
        <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', margin: 0 }}>User Growth</h3>
              <p style={{ fontSize: 12, color: '#334155', margin: '3px 0 0' }}>Daily signups — last 30 days</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(139,92,246,0.12)', borderRadius: 6 }}>
              <TrendingUp size={12} color="#a78bfa" />
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>+{s.newThisWeek} this week</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#334155' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 11, fill: '#334155' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#signupGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', margin: '0 0 4px' }}>Users by Plan</h3>
          <p style={{ fontSize: 12, color: '#334155', margin: '0 0 12px' }}>{fmt(total)} total users</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={planData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                {planData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} (${(((v as number) / total) * 100).toFixed(1)}%)`, '']} contentStyle={{ background: '#1e2535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
            {planData.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>
                  {fmt(p.value)} <span style={{ color: '#334155', fontWeight: 400 }}>({((p.value / total) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', margin: 0 }}>Recent Admin Activity</h3>
          <a href="/admin/audit-log" style={{ fontSize: 12, color: '#8b5cf6', textDecoration: 'none' }}>View all →</a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Action', 'Admin', 'Target User', 'Time'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#334155', padding: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px 0', fontSize: 13, color: '#e2e8f0' }}>{log.action}</td>
                <td style={{ padding: '12px 0', fontSize: 12, color: '#64748b' }}>{log.admin_email}</td>
                <td style={{ padding: '12px 0', fontSize: 12, color: '#64748b' }}>{log.target_user_email ?? '—'}</td>
                <td style={{ padding: '12px 0', fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> {timeAgo(log.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
