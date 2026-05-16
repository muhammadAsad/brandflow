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

// ── Demo data ─────────────────────────────────────────────────────────────────

const DEMO_ENGAGEMENT = [
  { day: 'Mon', ig: 4200, fb: 2100, tt: 3400, li: 1200 },
  { day: 'Tue', ig: 5800, fb: 2400, tt: 4200, li: 1800 },
  { day: 'Wed', ig: 4900, fb: 2900, tt: 3900, li: 2100 },
  { day: 'Thu', ig: 6800, fb: 3200, tt: 5100, li: 2400 },
  { day: 'Fri', ig: 7200, fb: 3800, tt: 6200, li: 2900 },
  { day: 'Sat', ig: 9100, fb: 4100, tt: 7800, li: 1900 },
  { day: 'Sun', ig: 8400, fb: 3700, tt: 7100, li: 1600 },
];

const DEMO_REACH = [
  { month: 'Jan', reach: 1.2 }, { month: 'Feb', reach: 1.5 },
  { month: 'Mar', reach: 1.3 }, { month: 'Apr', reach: 1.9 },
  { month: 'May', reach: 2.1 }, { month: 'Jun', reach: 2.4 },
];

const PIE_TRAFFIC = [
  { name: 'Instagram', value: 42, color: '#e1306c' },
  { name: 'TikTok',    value: 28, color: '#555'    },
  { name: 'Facebook',  value: 18, color: '#1877f2' },
  { name: 'LinkedIn',  value: 12, color: '#0077b5' },
];

const PIE_GENDER = [
  { name: 'Female', value: 58, color: '#a855f7' },
  { name: 'Male',   value: 38, color: '#3b82f6' },
  { name: 'Other',  value: 4,  color: '#94a3b8' },
];

const DEMO_AGE = [
  { group: '18-24', pct: 24 },
  { group: '25-34', pct: 38 },
  { group: '35-44', pct: 22 },
  { group: '45-54', pct: 11 },
  { group: '55+',   pct:  5 },
];

const DEMO_POSTS = [
  { id: '1', platform: 'instagram', content: 'Summer collection launch 🌟 Shop now and get 20% off your first order!', date: '2024-06-12', reach: 72000,  engagement: 6100, clicks: 2300, ctr: 3.2, img: 'https://picsum.photos/48/48?random=10' },
  { id: '2', platform: 'tiktok',    content: 'Behind the scenes of our campaign shoot — watch till the end! 🎬',         date: '2024-06-10', reach: 54000,  engagement: 8900, clicks: 1800, ctr: 3.3, img: 'https://picsum.photos/48/48?random=11' },
  { id: '3', platform: 'linkedin',  content: 'Top 5 growth strategies for B2B brands in 2024. Thread →',                date: '2024-06-09', reach: 31000,  engagement: 2400, clicks: 1200, ctr: 3.9, img: 'https://picsum.photos/48/48?random=12' },
  { id: '4', platform: 'instagram', content: 'Weekly poll: which product do you want to see next? 🗳️',                   date: '2024-06-08', reach: 67000,  engagement: 5900, clicks: 2100, ctr: 3.1, img: 'https://picsum.photos/48/48?random=13' },
  { id: '5', platform: 'facebook',  content: '7 hacks to boost your social media engagement today.',                      date: '2024-06-07', reach: 28000,  engagement: 1900, clicks:  950, ctr: 3.4, img: 'https://picsum.photos/48/48?random=14' },
  { id: '6', platform: 'tiktok',    content: 'POV: Your morning routine optimized for productivity ☕',                   date: '2024-06-05', reach: 91000,  engagement: 12400, clicks: 3200, ctr: 3.5, img: 'https://picsum.photos/48/48?random=15' },
  { id: '7', platform: 'instagram', content: 'New arrivals are here! 25 fresh styles added to the store.',               date: '2024-06-03', reach: 55000,  engagement: 4700, clicks: 1650, ctr: 3.0, img: 'https://picsum.photos/48/48?random=16' },
  { id: '8', platform: 'linkedin',  content: 'Lessons learned from scaling from 0 to 50K followers in 6 months.',        date: '2024-06-01', reach: 42000,  engagement: 3800, clicks: 1900, ctr: 4.5, img: 'https://picsum.photos/48/48?random=17' },
  { id: '9', platform: 'facebook',  content: 'Customer spotlight: How Jane grew her brand with BrandFlow.',              date: '2024-05-30', reach: 19000,  engagement: 1400, clicks:  720, ctr: 3.8, img: 'https://picsum.photos/48/48?random=18' },
  { id: '10', platform: 'instagram', content: 'Throwback to our first product shoot 📸 How far we\'ve come!',           date: '2024-05-28', reach: 48000,  engagement: 5200, clicks: 1400, ctr: 2.9, img: 'https://picsum.photos/48/48?random=19' },
];

const DEMO_STATS = { reach: 2400000, engagement: 128000, impressions: 5600000, ctr: 3.4 };

const SPARKLINE_REACH      = [1.2,1.5,1.3,1.9,2.1,2.4].map((v,i) => ({ v: v * 1e6, i }));
const SPARKLINE_ENGAGEMENT = [82,94,88,110,121,128].map((v,i)      => ({ v: v * 1000, i }));
const SPARKLINE_IMPRESSIONS = [3.1,3.8,3.4,4.5,5.0,5.6].map((v,i) => ({ v: v * 1e6, i }));
const SPARKLINE_CTR        = [2.8,3.1,2.9,3.3,3.5,3.4].map((v,i)  => ({ v, i }));

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

function exportCSV(posts: typeof DEMO_POSTS) {
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

const DEMO_AI_INSIGHTS: AIInsight[] = [
  { id:'ai1', title:'Instagram Reels driving 3× more reach', description:'Your Reels outperform static posts by 3.2×. Increasing frequency to 5/week could add ~35K reach.',          insight_type:'content',     action_url:'Increase Reels from 3 to 5 per week',                                is_read:false, created_at:new Date(Date.now()-2*3600000).toISOString() },
  { id:'ai2', title:'6–8 PM weekday posts get 3× engagement', description:'Weekday evening posts consistently outperform other time slots across all platforms.',                           insight_type:'performance', action_url:'Schedule high-priority posts between 6–8 PM weekdays',               is_read:false, created_at:new Date(Date.now()-5*3600000).toISOString() },
  { id:'ai3', title:'25–34 age group growing fastest (+28%)',  description:'This segment now represents 38% of your audience. Tailor content to career growth and entrepreneurship.',     insight_type:'audience',    action_url:'Create content for 25–34 audience (career, productivity, growth)',   is_read:true,  created_at:new Date(Date.now()-24*3600000).toISOString() },
  { id:'ai4', title:'LinkedIn B2B content ROI exceeds target', description:'LinkedIn posts generate 4.5% CTR — 18% above your average. Increase B2B thought leadership content.',         insight_type:'campaign',    action_url:'Publish 3 LinkedIn thought-leadership articles this week',            is_read:true,  created_at:new Date(Date.now()-48*3600000).toISOString() },
];

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
      setInsights(json.insights?.length ? json.insights : DEMO_AI_INSIGHTS);
    } catch {
      setInsights(DEMO_AI_INSIGHTS);
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

  // Filter engagement data by platform
  const engData = useMemo(() => {
    if (platform === 'all') return DEMO_ENGAGEMENT;
    const key = platform === 'instagram' ? 'ig' : platform === 'facebook' ? 'fb' : platform === 'tiktok' ? 'tt' : platform === 'linkedin' ? 'li' : null;
    if (!key) return DEMO_ENGAGEMENT;
    return DEMO_ENGAGEMENT.map(d => ({ day: d.day, [key]: (d as unknown as Record<string,number>)[key] }));
  }, [platform]);

  // Filter posts table
  const filteredPosts = useMemo(() => {
    let p = platform === 'all' ? DEMO_POSTS : DEMO_POSTS.filter(post => post.platform === platform);
    p = [...p].sort((a, b) => {
      const va = (a as Record<string,unknown>)[sortCol] as number;
      const vb = (b as Record<string,unknown>)[sortCol] as number;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return p;
  }, [platform, sortCol, sortDir]);

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
            { label: 'Total Reach',       value: fmtNum(DEMO_STATS.reach),       change: '+18%', color: '#7c3aed', icon: Eye,              spark: SPARKLINE_REACH      },
            { label: 'Total Engagement',  value: fmtNum(DEMO_STATS.engagement),  change: '+24%', color: '#0ea5e9', icon: Activity,         spark: SPARKLINE_ENGAGEMENT },
            { label: 'Total Impressions', value: fmtNum(DEMO_STATS.impressions), change: '+12%', color: '#10b981', icon: TrendingUp,        spark: SPARKLINE_IMPRESSIONS },
            { label: 'Avg CTR',           value: DEMO_STATS.ctr + '%',           change: '+0.6%',color: '#f59e0b', icon: MousePointerClick, spark: SPARKLINE_CTR        },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f0ff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 7px', borderRadius: 20 }}>{s.change}</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={s.spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`sg-${s.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={s.color} strokeWidth={2} fill={`url(#sg-${s.label})`} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
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
            <>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={engData} barSize={10} barGap={3} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8f7ff' }} />
                  {(platform === 'all' || platform === 'instagram') && <Bar dataKey="ig" name="Instagram" fill="#e1306c" radius={[4,4,0,0]} />}
                  {(platform === 'all' || platform === 'facebook')  && <Bar dataKey="fb" name="Facebook"  fill="#1877f2" radius={[4,4,0,0]} />}
                  {(platform === 'all' || platform === 'tiktok')    && <Bar dataKey="tt" name="TikTok"    fill="#555"    radius={[4,4,0,0]} />}
                  {(platform === 'all' || platform === 'linkedin')  && <Bar dataKey="li" name="LinkedIn"  fill="#0077b5" radius={[4,4,0,0]} />}
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
                {PLATFORMS_META.map(p => (
                  (platform === 'all' || platform === p.key) && (
                    <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: p.color }} />
                      {p.label}
                    </div>
                  )
                ))}
              </div>
            </>
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
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={DEMO_REACH} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="reachAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v + 'M'} />
                  <Tooltip formatter={(v) => [v + 'M', 'Reach']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={2.5} fill="url(#reachAreaGrad)" dot={{ fill: '#7c3aed', r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Traffic Sources donut */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Traffic Sources</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8' }}>Platform distribution</p>
            {loading ? <Skeleton h={180} br={100} /> : (
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={PIE_TRAFFIC} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {PIE_TRAFFIC.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v + '%', 'Share']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
              {PIE_TRAFFIC.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#475569' }}>{d.name}</span>
                  <div style={{ width: 60, height: 5, background: '#f1f0ff', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: d.value + '%', height: '100%', background: d.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{d.value}%</span>
                </div>
              ))}
            </div>
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
              <ResponsiveContainer width="100%" height={200}>
                <HBarChart data={DEMO_AGE} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v + '%'} />
                  <YAxis type="category" dataKey="group" tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip formatter={(v) => [v + '%', 'Audience']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 12 }} cursor={{ fill: '#f8f7ff' }} />
                  <HBar dataKey="pct" radius={[0,6,6,0]} fill="#7c3aed" background={{ fill: '#f5f3ff', radius: 6 }} />
                </HBarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gender split pie */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f0ff', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Gender Split</h3>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#94a3b8' }}>Follower gender breakdown</p>
            {loading ? <Skeleton h={160} br={100} /> : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={PIE_GENDER} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {PIE_GENDER.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v + '%', 'Share']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {PIE_GENDER.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#475569' }}>{d.name}</span>
                  <div style={{ width: 50, height: 5, background: '#f1f0ff', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: d.value + '%', height: '100%', background: d.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', minWidth: 30, textAlign: 'right' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </>}
      </div>

      {showAI && <AIReportModal onClose={() => setShowAI(false)} />}
    </>
  );
}
