'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as HBarChart, Bar as HBar,
} from 'recharts';
import {
  Eye, Activity, TrendingUp, MousePointerClick, Download,
  Sparkles, ChevronUp, ChevronDown, ChevronsUpDown, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  InstagramIcon, FacebookIcon, LinkedinIcon, TikTokIcon, XIcon,
} from '@/components/ui/platform-icons';

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = 'all' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'x';
type DateRange = '7d' | '30d' | '90d';
type SortDir  = 'asc' | 'desc' | null;

interface Snapshot {
  platform: string;
  snapshot_date: string;
  reach: number;
  engagement: number;
  impressions: number;
  clicks: number;
  followers: number;
}

// No demo data — analytics load from Supabase via /api/social/posts

type PostRow = { id: string; platform: string; content: string; date: string; reach: number; engagement: number; clicks: number; ctr: number; img?: string };

const PLATFORMS_META = [
  { key: 'instagram', label: 'Instagram', color: '#e1306c', barKey: 'ig', Icon: InstagramIcon },
  { key: 'facebook',  label: 'Facebook',  color: '#1877f2', barKey: 'fb', Icon: FacebookIcon  },
  { key: 'tiktok',    label: 'TikTok',    color: '#555',    barKey: 'tt', Icon: TikTokIcon    },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0077b5', barKey: 'li', Icon: LinkedinIcon  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtK(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(0) + 'K' : String(v);
}

function exportCSV(posts: PostRow[]) {
  const header = ['Platform','Content','Date','Reach','Engagement','Clicks','CTR'].join(',');
  const rows = posts.map(p =>
    [p.platform, `"${p.content.replace(/"/g,'""')}"`, p.date, p.reach, p.engagement, p.clicks, p.ctr + '%'].join(',')
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'brandflow-analytics.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ h, br = 12 }: { h: number; br?: number }) {
  return (
    <div style={{
      height: h, borderRadius: br,
      background: 'linear-gradient(90deg,#f1f0ff 25%,#e8e6ff 50%,#f1f0ff 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}

// ── AI Report Modal ───────────────────────────────────────────────────────────

function AIReportModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ai/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setAnalysis(json.analysis ?? '');
      } catch {
        setError('Failed to generate report. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Minimal markdown → HTML converter (bold, headers, bullets)
  function renderMarkdown(md: string) {
    return md
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: '20px 0 6px' }}>{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '14px 0 4px' }}>{line.slice(4)}</h4>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: '#1e293b', margin: '6px 0' }}>{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return <li key={i} style={{ fontSize: 13, color: '#475569', margin: '4px 0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: text }} />;
        }
        if (line.trim() === '') return <br key={i} />;
        const text = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} style={{ fontSize: 13, color: '#475569', margin: '4px 0', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: text }} />;
      });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.22)', zIndex: 1 }}>
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f1f0ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>AI Performance Report</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>Last 30 days · Generated by Claude</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'ping 1s infinite' }} />
                <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Analyzing your performance data…</span>
              </div>
              {[80, 60, 90, 50, 75, 65, 85, 55].map((w, i) => (
                <Skeleton key={i} h={14} br={6} />
              ))}
            </div>
          )}
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, fontSize: 13, color: '#dc2626' }}>{error}</div>}
          {analysis && !loading && (
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              {renderMarkdown(analysis)}
            </div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f0ff', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => { const blob = new Blob([analysis], { type: 'text/plain' }); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=u; a.download='ai-report.txt'; a.click(); }}
            disabled={!analysis}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: analysis ? 'pointer' : 'not-allowed', opacity: analysis ? 1 : 0.4 }}
          >
            <Download size={14} /> Export Report
          </button>
          <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ fontSize: 12, color: '#e2e8f0' }}>{p.name}: <strong>{fmtK(p.value)}</strong></span>
        </div>
      ))}
    </div>
  );
}

// ── AI Insights Tab ───────────────────────────────────────────────────────────

type InsightType = 'performance' | 'content' | 'audience' | 'campaign';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

const INSIGHT_TYPE_META: Record<InsightType, { label: string; color: string; bg: string; emoji: string }> = {
  performance: { label: 'Performance', color: '#7c3aed', bg: '#f5f3ff', emoji: '📈' },
  content:     { label: 'Content',     color: '#0ea5e9', bg: '#f0f9ff', emoji: '🎨' },
  audience:    { label: 'Audience',    color: '#059669', bg: '#ecfdf5', emoji: '👥' },
  campaign:    { label: 'Campaign',    color: '#f59e0b', bg: '#fffbeb', emoji: '🚀' },
};

// AI insights start empty and are fetched/generated on demand

function InsightsTab({ insights, onGenerate, onMarkRead, generating }: {
  insights: AIInsight[];
  onGenerate: (type: InsightType) => void;
  onMarkRead: (id: string) => void;
  generating: boolean;
}) {
  const [activeType, setActiveType] = useState<InsightType | 'all'>('all');
  const types: InsightType[] = ['performance', 'content', 'audience', 'campaign'];
  const filtered = activeType === 'all' ? insights : insights.filter(i => i.insight_type === activeType);
  const unread = insights.filter(i => !i.is_read).length;

  function fmtAgo(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
            AI Insights
            {unread > 0 && <span style={{ marginLeft: 8, background: '#7c3aed', color: '#fff', borderRadius: 999, fontSize: 12, fontWeight: 700, padding: '2px 8px' }}>{unread} new</span>}
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>AI-generated recommendations based on your analytics data</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {types.map(t => {
            const meta = INSIGHT_TYPE_META[t];
            return (
              <button key={t} onClick={() => onGenerate(t)} disabled={generating} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 9,
                border: `1.5px solid ${meta.color}40`, background: meta.bg, color: meta.color,
                fontSize: 12, fontWeight: 600, cursor: generating ? 'default' : 'pointer', opacity: generating ? 0.6 : 1,
              }}>
                {meta.emoji} {generating ? '…' : `+${meta.label}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', ...types] as (InsightType | 'all')[]).map(t => (
          <button key={t} onClick={() => setActiveType(t)} style={{
            padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: activeType === t ? 700 : 500, border: 'none',
            background: activeType === t ? '#7c3aed' : '#f8fafc', color: activeType === t ? '#fff' : '#64748b', cursor: 'pointer',
          }}>
            {t === 'all' ? `All (${insights.length})` : `${INSIGHT_TYPE_META[t].emoji} ${INSIGHT_TYPE_META[t].label}`}
          </button>
        ))}
      </div>

      {/* Insights list */}
      {generating && (
        <div style={{ background: '#f5f3ff', border: '1.5px solid #d8b4fe', borderRadius: 14, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'ping 1s infinite' }} />
          <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Claude is analyzing your data…</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>No insights yet</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Click a "+ Generate" button above to generate AI insights</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {filtered.map(insight => {
            const type = insight.insight_type as InsightType;
            const meta = INSIGHT_TYPE_META[type] ?? INSIGHT_TYPE_META.performance;
            return (
              <div key={insight.id} style={{
                background: '#fff', borderRadius: 16, padding: '18px 20px',
                border: `1px solid ${insight.is_read ? '#f1f0ff' : meta.color + '40'}`,
                boxShadow: insight.is_read ? '0 2px 8px rgba(0,0,0,0.04)' : `0 4px 16px ${meta.color}18`,
                position: 'relative', overflow: 'hidden',
              }}>
                {!insight.is_read && (
                  <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                )}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{meta.label}</span>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '2px 0 4px', lineHeight: 1.3 }}>{insight.title}</h4>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>{insight.description}</p>
                  </div>
                </div>
                {insight.action_url && (
                  <div style={{ background: meta.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>⚡ Action: </span>
                    <span style={{ fontSize: 12, color: '#475569' }}>{insight.action_url}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtAgo(insight.created_at)}</span>
                  {!insight.is_read && (
                    <button onClick={() => onMarkRead(insight.id)} style={{ fontSize: 11, fontWeight: 600, color: meta.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Mark as Read ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [platform, setPlatform]   = useState<Platform>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAI, setShowAI]       = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');
  const [insights, setInsights]   = useState<AIInsight[]>([]);
  const [generating, setGenerating] = useState(false);
  const insightsFetched = useRef(false);

  // Table state
  const [sortCol, setSortCol]     = useState<string>('reach');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [page, setPage]           = useState(1);
  const PER_PAGE = 5;

  // Fetch analytics snapshots
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      const res  = await fetch(`/api/social/posts?from=${from}`);
      // Use analytics endpoint if available, else snapshots via supabase direct
      // For now, rely on demo data shaped correctly
      if (!res.ok) throw new Error();
    } catch {
      // Keep demo data
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setLoading(false); }, []); // initial load complete

  // Fetch saved insights
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/insights');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setInsights(json.insights ?? []);
    } catch {
      setInsights([]);
    }
  }, []);

  // Auto-fetch insights when tab first opened
  useEffect(() => {
    if (activeTab === 'insights' && !insightsFetched.current) {
      insightsFetched.current = true;
      fetchInsights();
    }
  }, [activeTab, fetchInsights]);

  async function generateInsight(type: InsightType) {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (json.insight) {
        const newInsight: AIInsight = {
          id: `new-${Date.now()}`,
          title: json.insight.title,
          description: json.insight.description,
          insight_type: type,
          action_url: json.insight.action,
          is_read: false,
          created_at: new Date().toISOString(),
        };
        setInsights(prev => [newInsight, ...prev]);
      }
    } catch {}
    finally { setGenerating(false); }
  }

  async function markInsightRead(id: string) {
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_read: true } : i));
    fetch('/api/ai/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  // Engagement chart data — empty until real data is connected
  const engData: { day: string; ig?: number; fb?: number; tt?: number; li?: number }[] = [];

  // Posts table — empty until real data is connected
  const filteredPosts: PostRow[] = [];

  const totalPages  = Math.ceil(filteredPosts.length / PER_PAGE);
  const pagedPosts  = filteredPosts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
    setPage(1);
  };

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} color="#7c3aed" /> : <ChevronDown size={12} color="#7c3aed" />;
  }

  const getPlatformMeta = (key: string) => PLATFORMS_META.find(p => p.key === key) ?? PLATFORMS_META[0];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes ping{0%,100%{opacity:1}50%{opacity:0.3}}
        .analytics-page{animation:fadeUp 0.35s ease both}
        .pill-btn:hover{opacity:0.85}
        .sort-th:hover{background:#f8f7ff;cursor:pointer}
        .post-row:hover{background:#fafaf9!important}
      `}</style>

      <div className="analytics-page" style={{ padding: '0 28px 32px' }}>

        {/* ── Page tabs ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20, borderBottom: '1px solid #f1f0ff', paddingBottom: 0 }}>
          {([['overview','Overview'], ['insights','AI Insights ✨']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? '#7c3aed' : '#64748b',
              borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: -1,
            }}>{label}</button>
          ))}
        </div>

        {activeTab === 'insights' && (
          <InsightsTab
            insights={insights}
            onGenerate={generateInsight}
            onMarkRead={markInsightRead}
            generating={generating}
          />
        )}

        {activeTab === 'overview' && <>

        {/* ── Top Stats ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Total Reach',       color: '#7c3aed', icon: Eye              },
            { label: 'Total Engagement',  color: '#0ea5e9', icon: Activity         },
            { label: 'Total Impressions', color: '#10b981', icon: TrendingUp        },
            { label: 'Avg CTR',           color: '#f59e0b', icon: MousePointerClick },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f0ff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>—</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={18} color={s.color} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Connect social accounts to see data</div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #f1f0ff', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Platform pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'instagram', 'facebook', 'linkedin', 'tiktok', 'x'] as Platform[]).map(p => {
              const meta = p === 'all' ? null : PLATFORMS_META.find(m => m.key === p);
              const active = platform === p;
              return (
                <button
                  key={p}
                  className="pill-btn"
                  onClick={() => { setPlatform(p); setPage(1); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                    background: active ? (meta?.color ?? '#7c3aed') : '#f8fafc',
                    color: active ? '#fff' : '#64748b',
                  }}
                >
                  {meta && <meta.Icon size={12} color={active ? '#fff' : meta.color} />}
                  {p === 'all' ? 'All Platforms' : p === 'x' ? 'X (Twitter)' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1 }} />

          {/* Date range */}
          <div style={{ display: 'flex', gap: 4, background: '#f8fafc', borderRadius: 10, padding: 3 }}>
            {([['7d','7 Days'],['30d','30 Days'],['90d','90 Days']] as [DateRange,string][]).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setDateRange(v)}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', background: dateRange === v ? '#fff' : 'transparent', color: dateRange === v ? '#7c3aed' : '#94a3b8', boxShadow: dateRange === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => exportCSV(filteredPosts)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Download size={13} /> Export CSV
          </button>

          {/* AI Report */}
          <button
            onClick={() => setShowAI(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}
          >
            <Sparkles size={13} /> Generate AI Report
          </button>
        </div>

        {/* ── Chart 1: Engagement by Platform ────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Engagement by Platform</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Daily breakdown across all channels</p>
            </div>
            <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', padding: '4px 12px', borderRadius: 20 }}>↑ 24% vs last period</span>
          </div>
          {loading ? <Skeleton h={240} /> : (
            <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', borderRadius: 10 }}>
              <Activity size={36} color="#c4b5fd" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Connect social accounts to see analytics</p>
            </div>
          )}
        </div>

        {/* ── Chart 2: Reach Growth + Traffic Sources ─────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Reach Growth */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Reach Growth</h3>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Last 6 months</p>
              </div>
              <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', padding: '4px 12px', borderRadius: 20 }}>+18% vs last period</span>
            </div>
            {loading ? <Skeleton h={200} /> : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', borderRadius: 10 }}>
                <TrendingUp size={32} color="#c4b5fd" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Connect social accounts to see analytics</p>
              </div>
            )}
          </div>

          {/* Traffic Sources donut */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Traffic Sources</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8' }}>Platform distribution</p>
            {loading ? <Skeleton h={180} br={100} /> : (
              <div style={{ height: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', borderRadius: 10 }}>
                <Eye size={28} color="#c4b5fd" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' }}>Connect social accounts to see analytics</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Chart 3: Top Performing Posts Table ─────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff', overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f0ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Top Performing Posts</h3>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>{filteredPosts.length} posts · sorted by {sortCol}</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => <Skeleton key={i} h={52} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafaf9' }}>
                    <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Post</th>
                    <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform</th>
                    <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                    {['reach','engagement','clicks','ctr'].map(col => (
                      <th key={col} className="sort-th" onClick={() => handleSort(col)} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: sortCol === col ? '#7c3aed' : '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap', userSelect: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {col.toUpperCase()} <SortIcon col={col} />
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPosts.map((post, i) => {
                    const pm = getPlatformMeta(post.platform);
                    return (
                      <tr key={post.id} className="post-row" style={{ borderTop: '1px solid #f8f7ff', background: i % 2 === 0 ? '#fff' : 'transparent', transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: '#334155', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{post.content}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: pm.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <pm.Icon size={12} color={pm.color} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{pm.label}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{post.date}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{fmtNum(post.reach)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{fmtNum(post.engagement)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{fmtNum(post.clicks)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: post.ctr >= 4 ? '#7c3aed' : '#64748b', background: post.ctr >= 4 ? '#f5f3ff' : '#f8fafc', padding: '3px 8px', borderRadius: 20 }}>{post.ctr}%</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>View Details</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 22px', borderTop: '1px solid #f8f7ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filteredPosts.length)} of {filteredPosts.length} posts</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: page > 1 ? 'pointer' : 'not-allowed', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: page === p ? '#7c3aed' : '#f8fafc', color: page === p ? '#fff' : '#64748b' }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={{ width: 32, height: 32, borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: page < totalPages ? 'pointer' : 'not-allowed', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Chart 4: Audience Demographics ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

          {/* Age groups horizontal bar */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Audience by Age</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8' }}>Age group distribution of your followers</p>
            {loading ? <Skeleton h={200} /> : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', borderRadius: 10 }}>
                <Activity size={30} color="#c4b5fd" style={{ marginBottom: 10 }} />
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Connect social accounts to see analytics</p>
              </div>
            )}
          </div>

          {/* Gender split pie */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Gender Split</h3>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#94a3b8' }}>Follower gender breakdown</p>
            {loading ? <Skeleton h={160} br={100} /> : (
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fafaf9', borderRadius: 10 }}>
                <Eye size={28} color="#c4b5fd" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' }}>Connect social accounts to see analytics</p>
              </div>
            )}
          </div>
        </div>

        </>}
      </div>

      {showAI && <AIReportModal onClose={() => setShowAI(false)} />}
    </>
  );
}
