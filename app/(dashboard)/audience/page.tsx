'use client';

import { useState } from 'react';
import {
  Area, AreaChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ChevronDown, Heart, Play, TrendingUp, Users, Zap, Star } from 'lucide-react';
import {
  InstagramIcon, FacebookIcon, LinkedinIcon,
  YoutubeIcon, TikTokIcon,
} from '@/components/ui/platform-icons';

// ── Data ──────────────────────────────────────────────────────────────────────

const GROWTH_DAILY = [
  { date: 'Apr 20', value: 24200 },
  { date: 'Apr 27', value: 31800 },
  { date: 'May 4',  value: 44500 },
  { date: 'May 11', value: 57900 },
  { date: 'May 18', value: 89700 },
];
const GROWTH_WEEKLY = [
  { date: 'Wk 1', value: 24200 },
  { date: 'Wk 2', value: 35000 },
  { date: 'Wk 3', value: 48000 },
  { date: 'Wk 4', value: 62000 },
  { date: 'Wk 5', value: 89700 },
];
const GROWTH_MONTHLY = [
  { date: 'Jan', value: 55000 },
  { date: 'Feb', value: 63000 },
  { date: 'Mar', value: 70000 },
  { date: 'Apr', value: 79000 },
  { date: 'May', value: 89700 },
];

const GEO_DATA = [
  { country: 'United States',  value: '28.6K', pct: '32%', dot: '#7c3aed' },
  { country: 'United Kingdom', value: '16.1K', pct: '18%', dot: '#a78bfa' },
  { country: 'India',          value: '12.5K', pct: '14%', dot: '#22c55e' },
  { country: 'Canada',         value: '6.2K',  pct: '7%',  dot: '#f59e0b' },
  { country: 'Australia',      value: '4.8K',  pct: '5%',  dot: '#f87171' },
  { country: 'Other Countries',value: '21.5K', pct: '24%', dot: '#cbd5e1' },
];

const TOP_CONTENT = [
  { platform: 'instagram', type: 'Reel',     title: 'Sunset vibes and good energy ✨',      date: 'May 16, 2024', reach: '128.4K', engagement: '12.4K', er: '9.7%',  likes: '12.4K', bg: '#1e1b3a' },
  { platform: 'tiktok',    type: 'Video',    title: 'Behind the scenes of our process',     date: 'May 15, 2024', reach: '87.3K',  engagement: '8.7K',  er: '10.0%', likes: '8.7K',  bg: '#0f172a' },
  { platform: 'instagram', type: 'Carousel', title: 'Top 5 productivity tips for creators', date: 'May 14, 2024', reach: '72.6K',  engagement: '6.1K',  er: '8.4%',  likes: '6.1K',  bg: '#1e3a5f' },
  { platform: 'linkedin',  type: 'Article',  title: 'The future of remote work in 2024',   date: 'May 13, 2024', reach: '64.2K',  engagement: '5.8K',  er: '9.0%',  likes: '5.8K',  bg: '#0a2540' },
  { platform: 'facebook',  type: 'Post',     title: 'Our new product is live! 🚀',          date: 'May 12, 2024', reach: '52.1K',  engagement: '4.3K',  er: '8.2%',  likes: '4.3K',  bg: '#1a1a2e' },
];

const PLATFORM_TABS = [
  { key: 'all',       label: 'All Content' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'facebook',  label: 'Facebook' },
  { key: 'youtube',   label: 'YouTube' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function PlatformIcon({ platform, size = 13 }: { platform: string; size?: number }) {
  if (platform === 'instagram') return <InstagramIcon size={size} />;
  if (platform === 'tiktok')    return <TikTokIcon    size={size} color="#010101" />;
  if (platform === 'linkedin')  return <LinkedinIcon  size={size} />;
  if (platform === 'facebook')  return <FacebookIcon  size={size} />;
  if (platform === 'youtube')   return <YoutubeIcon   size={size} />;
  return null;
}

function fmtK(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

// ── Custom Chart Tooltip ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const val  = payload[0].value;
  const diff = Math.floor(val * 0.049); // simulated delta vs previous
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      padding: '12px 16px', border: '1px solid #ede9fe', minWidth: 170,
    }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
        {fmtK(val)} Total Audience
      </div>
      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
        ↑ {fmtK(diff)} vs {label}
      </div>
    </div>
  );
}

// ── World Map SVG ─────────────────────────────────────────────────────────────

function WorldMap() {
  // Simplified continent paths, viewBox 760x360
  const LAND = '#e2e8f0';
  const continents = [
    // North America
    { d: 'M58,22 L95,14 L145,12 L195,18 L220,32 L228,52 L222,72 L218,92 L208,112 L198,130 L185,148 L170,155 L155,148 L142,135 L124,128 L108,115 L92,98 L76,78 L62,58 L52,40 Z', fill: LAND },
    // Greenland
    { d: 'M210,5 L240,3 L252,12 L248,25 L235,32 L220,28 L210,18 Z', fill: LAND },
    // South America
    { d: 'M148,162 L185,152 L208,162 L218,180 L220,205 L215,232 L205,258 L192,275 L175,282 L158,276 L146,258 L140,232 L138,205 L140,180 Z', fill: LAND },
    // Europe
    { d: 'M295,15 L335,10 L368,12 L390,22 L398,38 L395,55 L385,68 L368,75 L348,78 L328,74 L312,62 L298,48 L292,32 Z', fill: LAND },
    // Africa
    { d: 'M290,82 L338,72 L378,75 L408,88 L422,110 L428,138 L428,168 L420,200 L405,228 L385,248 L360,256 L335,254 L310,240 L292,218 L280,190 L275,160 L278,130 L282,105 Z', fill: LAND },
    // Asia (mainland)
    { d: 'M396,10 L460,6 L520,8 L570,14 L615,24 L648,40 L665,58 L668,78 L658,98 L640,115 L618,128 L592,138 L562,142 L532,138 L505,130 L480,120 L458,110 L438,98 L420,85 L406,68 L396,50 L392,30 Z', fill: LAND },
    // India peninsula
    { d: 'M510,128 L535,125 L550,138 L548,158 L538,175 L522,182 L508,175 L500,158 L500,140 Z', fill: LAND },
    // Southeast Asia / Indonesia rough
    { d: 'M588,140 L625,132 L648,138 L658,152 L648,162 L625,165 L600,158 L585,148 Z', fill: LAND },
    // Japan
    { d: 'M648,52 L658,48 L665,55 L662,65 L652,68 L645,62 Z', fill: LAND },
    // Australia
    { d: 'M578,202 L625,195 L668,198 L692,215 L698,238 L692,260 L672,275 L645,280 L618,272 L596,255 L580,235 L572,215 Z', fill: LAND },
    // New Zealand
    { d: 'M705,258 L714,252 L718,262 L712,272 L704,268 Z', fill: LAND },
    // UK / Ireland
    { d: 'M296,28 L305,24 L312,30 L310,42 L300,45 L292,38 Z', fill: LAND },
  ];

  // Country highlights
  const highlights = [
    // USA
    { d: 'M62,72 L140,68 L175,75 L195,88 L195,120 L178,138 L155,148 L142,135 L124,128 L108,115 L92,98 L76,78 Z', fill: '#7c3aed', opacity: 0.85 },
    // Canada
    { d: 'M62,22 L195,18 L220,32 L228,52 L222,72 L170,68 L140,68 L95,65 L62,72 L52,50 Z', fill: '#a78bfa', opacity: 0.55 },
    // UK
    { d: 'M296,28 L305,24 L312,30 L310,42 L300,45 L292,38 Z', fill: '#22c55e', opacity: 0.85 },
    // India
    { d: 'M510,128 L535,125 L550,138 L548,158 L538,175 L522,182 L508,175 L500,158 L500,140 Z', fill: '#22c55e', opacity: 0.6 },
    // Australia
    { d: 'M578,202 L625,195 L668,198 L692,215 L698,238 L692,260 L672,275 L645,280 L618,272 L596,255 L580,235 L572,215 Z', fill: '#f87171', opacity: 0.6 },
  ];

  return (
    <svg viewBox="0 0 760 310" style={{ width: '100%', height: '100%' }}>
      {/* Ocean */}
      <rect width="760" height="310" fill="#f8f7ff" />
      {/* Landmasses */}
      {continents.map((c, i) => (
        <path key={i} d={c.d} fill={c.fill} />
      ))}
      {/* Country highlights */}
      {highlights.map((h, i) => (
        <path key={i} d={h.d} fill={h.fill} opacity={h.opacity} />
      ))}
      {/* Gradient legend */}
      <defs>
        <linearGradient id="mapGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="10" y="285" width="80" height="8" rx="4" fill="url(#mapGrad)" />
      <text x="10"  y="300" fill="#94a3b8" fontSize="9">Low</text>
      <text x="75" y="300" fill="#94a3b8" fontSize="9">High</text>
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, change, iconBg, iconColor }: {
  icon: React.ReactNode; label: string; value: string;
  change: string; iconBg: string; iconColor: string;
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '16px 18px',
      border: '1px solid #f1f0ff', flex: 1,
      boxShadow: '0 1px 4px rgba(124,58,237,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>↑ {change}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>vs last month</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AudiencePage() {
  const [activeTab,  setActiveTab]  = useState('all');
  const [rangeLabel, setRangeLabel] = useState('This Month');
  const [chartRange, setChartRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [showRangeDd, setShowRangeDd] = useState(false);
  const [showChartDd, setShowChartDd] = useState(false);

  const chartData =
    chartRange === 'Weekly'  ? GROWTH_WEEKLY :
    chartRange === 'Monthly' ? GROWTH_MONTHLY :
    GROWTH_DAILY;

  const filteredContent = activeTab === 'all'
    ? TOP_CONTENT
    : TOP_CONTENT.filter(c => c.platform === activeTab);

  return (
    <div style={{ padding: '0 24px 32px', display: 'flex', gap: 20, fontFamily: "'DM Sans','Segoe UI',sans-serif", minHeight: '100%' }}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div style={{ flex: '0 0 55%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Audience Overview</h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#94a3b8' }}>Understand your audience growth and demographics</p>
          </div>
          {/* Range dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRangeDd(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1.5px solid #ede9fe', borderRadius: 10, fontSize: 13, color: '#374151', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              🗓 {rangeLabel} <ChevronDown size={13} />
            </button>
            {showRangeDd && (
              <div style={{ position: 'absolute', right: 0, top: 40, background: '#fff', border: '1px solid #ede9fe', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 150, overflow: 'hidden' }}>
                {['This Week', 'This Month', 'Last 3 Months', 'This Year'].map(r => (
                  <div key={r} onClick={() => { setRangeLabel(r); setShowRangeDd(false); }}
                    style={{ padding: '9px 16px', fontSize: 13, color: r === rangeLabel ? '#7c3aed' : '#374151', fontWeight: r === rangeLabel ? 700 : 400, cursor: 'pointer', background: r === rangeLabel ? '#f8f7ff' : 'none' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f7ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = r === rangeLabel ? '#f8f7ff' : 'none'; }}>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4 Stat cards */}
        <div style={{ display: 'flex', gap: 12 }}>
          <StatCard icon={<Users  size={17} color="#7c3aed" />} label="Total Audience"   value="89.7K" change="21%" iconBg="rgba(124,58,237,0.1)"  iconColor="#7c3aed" />
          <StatCard icon={<TrendingUp size={17} color="#10b981" />} label="New Audience" value="12.4K" change="18%" iconBg="rgba(16,185,129,0.1)"  iconColor="#10b981" />
          <StatCard icon={<Zap    size={17} color="#f59e0b" />} label="Engagement Rate" value="4.8%"  change="12%" iconBg="rgba(245,158,11,0.1)"  iconColor="#f59e0b" />
          <StatCard icon={<Star   size={17} color="#f87171" />} label="Loyal Followers"  value="34.2K" change="15%" iconBg="rgba(248,113,113,0.1)" iconColor="#f87171" />
        </div>

        {/* Geography card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 20px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Audience by Geography</h2>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {/* Map */}
            <div style={{ flex: '0 0 55%' }}>
              <WorldMap />
            </div>
            {/* Country table */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Country</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience</span>
              </div>
              {GEO_DATA.map(row => (
                <div key={row.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderTop: '1px solid #f8f7ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{row.country}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{row.value}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', width: 32, textAlign: 'right' }}>{row.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth chart card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px 20px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Audience Growth</h2>
            {/* Chart range dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowChartDd(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#f8f7ff', border: '1.5px solid #ede9fe', borderRadius: 8, fontSize: 12, color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
                {chartRange} <ChevronDown size={12} />
              </button>
              {showChartDd && (
                <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', border: '1px solid #ede9fe', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                  {(['Daily', 'Weekly', 'Monthly'] as const).map(r => (
                    <div key={r} onClick={() => { setChartRange(r); setShowChartDd(false); }}
                      style={{ padding: '8px 16px', fontSize: 12, color: r === chartRange ? '#7c3aed' : '#374151', fontWeight: r === chartRange ? 700 : 400, cursor: 'pointer', background: r === chartRange ? '#f8f7ff' : 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f7ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = r === chartRange ? '#f8f7ff' : 'none'; }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="audienceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ff" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false} axisLine={false}
                ticks={[0, 25000, 50000, 75000, 100000]}
                tickFormatter={(v: number) => v === 0 ? '0' : `${v / 1000}K`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area
                type="monotone" dataKey="value"
                stroke="#7c3aed" strokeWidth={2.5}
                fill="url(#audienceGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)', padding: '20px 20px', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Top Performing Content</h2>
          <button style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', padding: 0 }}>View all</button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#94a3b8' }}>Your best performing posts across all platforms</p>

        {/* Platform tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {PLATFORM_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20,
                  background: active ? '#ede9fe' : '#f8f7ff',
                  border: `1.5px solid ${active ? '#c4b5fd' : '#f1f0ff'}`,
                  color: active ? '#7c3aed' : '#64748b',
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}>
                {tab.key !== 'all' && <PlatformIcon platform={tab.key} size={13} />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'auto' }}>
          {filteredContent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
              No content for this platform yet.
            </div>
          ) : filteredContent.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 0',
              borderBottom: i < filteredContent.length - 1 ? '1px solid #f8f7ff' : 'none',
            }}>
              {/* Thumbnail */}
              <div style={{
                width: 72, height: 56, borderRadius: 10, background: item.bg,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', cursor: 'pointer',
              }}>
                {/* Subtle gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(0,0,0,0.4))' }} />
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative', zIndex: 1,
                }}>
                  <Play size={10} color="#7c3aed" fill="#7c3aed" style={{ marginLeft: 1 }} />
                </div>
              </div>

              {/* Title + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <PlatformIcon platform={item.platform} size={12} />
                  <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{item.type}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.date}</div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Reach</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.reach}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Engagement</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.engagement}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>ER</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.er}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Heart size={12} color="#f87171" fill="#f87171" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.likes}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer link */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f0ff', textAlign: 'center' }}>
          <button style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            📊 See all content analytics →
          </button>
        </div>
      </div>
    </div>
  );
}
