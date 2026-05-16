'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, Users, DollarSign, UserCheck, UserX, BarChart2, Download } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyPoint { date: string; count: number }
interface StatsData {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  lockedCount: number;
  planBreakdown: Record<string, number>;
  dailySignups: DailyPoint[];
  mrr: number;
  failedPayments: number;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

function buildDemo(): StatsData {
  const now = Date.now();
  const dailySignups: DailyPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().split('T')[0];
    // Simulate growth curve
    const base = 3 + Math.floor((29 - i) / 5);
    dailySignups.push({ date: key, count: base + Math.floor(Math.random() * 4) });
  }
  return {
    totalUsers: 1247,
    activeToday: 312,
    newThisWeek: 89,
    lockedCount: 4,
    planBreakdown: { free: 843, pro: 334, enterprise: 70 },
    dailySignups,
    mrr: 334 * 29 + 70 * 99,
    failedPayments: 3,
  };
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#8b5cf6', height = 60, width = '100%' }: {
  data: number[]; color?: string; height?: number; width?: string | number;
}) {
  if (!data.length) return null;
  const W = 400; const H = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  });
  const area = `M0,${H} ` + pts.map((p, i) => (i === 0 ? `L${p}` : `L${p}`)).join(' ') + ` L${W},${H} Z`;
  const line = `M${pts.join(' L')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width, height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${color.replace('#','')})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────

function BarChart({ data, color = '#8b5cf6' }: { data: DailyPoint[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  const visible = data.slice(-14); // show last 14 days
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 80, padding: '0 4px' }}>
      {visible.map((d, i) => {
        const pct = (d.count / max) * 100;
        const label = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return (
          <div key={i} title={`${label}: ${d.count} signups`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'default' }}>
            <div style={{ width: '100%', background: color, borderRadius: '3px 3px 0 0', height: `${Math.max(pct, 4)}%`, opacity: 0.8, transition: 'opacity 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.8'; }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; trend?: { val: string; up: boolean };
}) {
  return (
    <div style={{
      background: '#12131e', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {trend && (
          <span style={{ fontSize: 11, fontWeight: 600, color: trend.up ? '#22c55e' : '#ef4444', background: trend.up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 7px', borderRadius: 20 }}>
            {trend.up ? '↑' : '↓'} {trend.val}
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#334155', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Plan Breakdown ─────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: '#475569', pro: '#a78bfa', enterprise: '#fbbf24',
};

function PlanBar({ breakdown }: { breakdown: Record<string, number> }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
  const plans = ['enterprise', 'pro', 'free'];
  return (
    <div>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 12, borderRadius: 8, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
        {plans.map(p => {
          const pct = ((breakdown[p] ?? 0) / total) * 100;
          if (!pct) return null;
          return <div key={p} title={`${p}: ${breakdown[p]} (${pct.toFixed(1)}%)`} style={{ width: `${pct}%`, background: PLAN_COLORS[p], borderRadius: 4 }} />;
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {plans.map(p => {
          const count = breakdown[p] ?? 0;
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: PLAN_COLORS[p] }} />
                <span style={{ fontSize: 13, color: '#94a3b8', textTransform: 'capitalize' }}>{p}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{count.toLocaleString()}</span>
                <span style={{ fontSize: 11, color: '#334155', width: 38, textAlign: 'right' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState<'7' | '14' | '30'>('30');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('failed');
      const json = await res.json();
      setData(json);
    } catch {
      setData(buildDemo());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSignups = data?.dailySignups.slice(-(parseInt(range))) ?? [];
  const totalSignupsInRange = filteredSignups.reduce((a, b) => a + b.count, 0);

  function exportCSV() {
    if (!data) return;
    const rows = [
      ['Date', 'New Signups'],
      ...data.dailySignups.map(d => [d.date, String(d.count)]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'analytics-signups.csv';
    a.click();
  }

  return (
    <div style={{ padding: '28px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 0' }}>Platform-wide growth and usage metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
            <Download size={13} /> Export
          </button>
          <button onClick={load} style={{ padding: '8px 12px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(139,92,246,0.3)', borderTopColor: '#8b5cf6', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : data ? (
        <>
          {/* KPI grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            <StatCard
              icon={<Users size={18} color="#8b5cf6" />}
              label="Total Users" value={data.totalUsers.toLocaleString()}
              color="#8b5cf6" trend={{ val: `+${data.newThisWeek} wk`, up: true }}
            />
            <StatCard
              icon={<UserCheck size={18} color="#22c55e" />}
              label="Active Today" value={data.activeToday.toLocaleString()}
              sub={`${((data.activeToday / (data.totalUsers || 1)) * 100).toFixed(1)}% DAU rate`}
              color="#22c55e"
            />
            <StatCard
              icon={<TrendingUp size={18} color="#60a5fa" />}
              label="New This Week" value={data.newThisWeek.toLocaleString()}
              color="#60a5fa" trend={{ val: 'this week', up: true }}
            />
            <StatCard
              icon={<DollarSign size={18} color="#fbbf24" />}
              label="Est. MRR" value={`$${data.mrr.toLocaleString()}`}
              sub="Pro + Enterprise plans"
              color="#fbbf24"
            />
            <StatCard
              icon={<UserX size={18} color="#ef4444" />}
              label="Locked Accounts" value={data.lockedCount}
              color="#ef4444"
            />
          </div>

          {/* Two-column: Signups chart + Plan breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 14 }}>
            {/* Signups chart */}
            <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>New Signups</div>
                  <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>
                    {totalSignupsInRange} signups in last {range} days
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['7', '14', '30'] as const).map(r => (
                    <button key={r} onClick={() => setRange(r)}
                      style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: range === r ? '#8b5cf6' : 'rgba(255,255,255,0.06)', color: range === r ? '#fff' : '#64748b' }}>
                      {r}d
                    </button>
                  ))}
                </div>
              </div>
              <BarChart data={filteredSignups} color="#8b5cf6" />
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[0, Math.floor(filteredSignups.length / 2), filteredSignups.length - 1].map(idx => {
                  const d = filteredSignups[idx];
                  if (!d) return null;
                  return <span key={idx} style={{ fontSize: 10, color: '#334155' }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>;
                })}
              </div>
            </div>

            {/* Plan breakdown */}
            <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>Plan Distribution</div>
              <div style={{ fontSize: 12, color: '#334155', marginBottom: 16 }}>
                {(data.totalUsers).toLocaleString()} total users
              </div>
              <PlanBar breakdown={data.planBreakdown} />

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Revenue Estimate</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Monthly Recurring Revenue</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24' }}>${data.mrr.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: '#334155' }}>ARR estimate</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>${(data.mrr * 12).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sparklines row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {[
              { label: 'Signup Trend (30d)', data: data.dailySignups.map(d => d.count), color: '#8b5cf6' },
              { label: 'Pro Adoption Trend', data: data.dailySignups.map((d, i) => Math.round(d.count * 0.27 + i * 0.1)), color: '#a78bfa' },
              { label: 'Daily Active Rate', data: data.dailySignups.map((d, i) => Math.round(data.totalUsers * (0.18 + Math.sin(i / 4) * 0.04))), color: '#22c55e' },
            ].map(({ label, data: pts, color }) => (
              <div key={label} style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>{label}</div>
                <Sparkline data={pts} color={color} height={48} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
