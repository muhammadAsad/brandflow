'use client';

import { useState } from 'react';
import {
  Area, AreaChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Heart, Play, Users, TrendingUp, Zap, Star, ChevronDown } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import {
  InstagramIcon, FacebookIcon, LinkedinIcon,
  YoutubeIcon, TikTokIcon,
} from '@/components/ui/platform-icons';

// ── Data ──────────────────────────────────────────────────────────────────────

const GROWTH_DATA = {
  Daily: [
    { date: 'Apr 20', value: 24200 },
    { date: 'Apr 27', value: 31800 },
    { date: 'May 4',  value: 44500 },
    { date: 'May 11', value: 57900 },
    { date: 'May 18', value: 89700 },
  ],
  Weekly: [
    { date: 'Wk 1', value: 24200 },
    { date: 'Wk 2', value: 38000 },
    { date: 'Wk 3', value: 52000 },
    { date: 'Wk 4', value: 68000 },
    { date: 'Wk 5', value: 89700 },
  ],
  Monthly: [
    { date: 'Jan', value: 55000 },
    { date: 'Feb', value: 63000 },
    { date: 'Mar', value: 70000 },
    { date: 'Apr', value: 79000 },
    { date: 'May', value: 89700 },
  ],
};

const GEO_ROWS = [
  { country: 'United States',   value: '28.6K', pct: '32%', w: '62%', dot: '#7c3aed' },
  { country: 'United Kingdom',  value: '16.1K', pct: '18%', w: '38%', dot: '#0ea5e9' },
  { country: 'India',           value: '12.5K', pct: '14%', w: '28%', dot: '#10b981' },
  { country: 'Canada',          value: '6.2K',  pct: '7%',  w: '14%', dot: '#f59e0b' },
  { country: 'Australia',       value: '4.8K',  pct: '5%',  w: '10%', dot: '#f87171' },
  { country: 'Other Countries', value: '21.5K', pct: '24%', w: '48%', dot: '#cbd5e1' },
];

const TOP_CONTENT = [
  { platform: 'instagram', type: 'Reel',     title: 'Sunset vibes and good energy ✨',      date: 'May 16, 2024', reach: '128.4K', engagement: '12.4K', er: '9.7%',  likes: '12.4K', img: 'https://picsum.photos/160/160?random=10' },
  { platform: 'tiktok',    type: 'Video',    title: 'Behind the scenes of our process',     date: 'May 15, 2024', reach: '87.3K',  engagement: '8.7K',  er: '10.0%', likes: '8.7K',  img: 'https://picsum.photos/160/160?random=11' },
  { platform: 'instagram', type: 'Carousel', title: 'Top 5 productivity tips for creators', date: 'May 14, 2024', reach: '72.6K',  engagement: '6.1K',  er: '8.4%',  likes: '6.1K',  img: 'https://picsum.photos/160/160?random=12' },
  { platform: 'linkedin',  type: 'Article',  title: 'The future of remote work in 2024',   date: 'May 13, 2024', reach: '64.2K',  engagement: '5.8K',  er: '9.0%',  likes: '5.8K',  img: 'https://picsum.photos/160/160?random=13' },
  { platform: 'facebook',  type: 'Post',     title: 'Our new product is live! 🚀',          date: 'May 12, 2024', reach: '52.1K',  engagement: '4.3K',  er: '8.2%',  likes: '4.3K',  img: 'https://picsum.photos/160/160?random=14' },
];

const PLATFORM_TABS = [
  { key: 'all',       label: 'All Content' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'facebook',  label: 'Facebook' },
  { key: 'youtube',   label: 'YouTube' },
];

// ── Platform icon helper ──────────────────────────────────────────────────────

function PlatformIcon({ platform, size = 13 }: { platform: string; size?: number }) {
  if (platform === 'instagram') return <InstagramIcon size={size} />;
  if (platform === 'tiktok')    return <TikTokIcon    size={size} color="#010101" />;
  if (platform === 'linkedin')  return <LinkedinIcon  size={size} />;
  if (platform === 'facebook')  return <FacebookIcon  size={size} />;
  if (platform === 'youtube')   return <YoutubeIcon   size={size} />;
  return null;
}

// ── Real Geographic World Map (react-simple-maps + Natural Earth TopoJSON) ────

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ISO 3166-1 numeric → highlight colour
const COUNTRY_FILL: Record<string, string> = {
  '840': '#7c3aed', // United States  — dark purple
  '124': '#a78bfa', // Canada          — light purple
  '826': '#0ea5e9', // United Kingdom  — sky blue
  '356': '#10b981', // India           — green
  '36':  '#f87171', // Australia       — coral
};

function GeoWorldMap() {
  return (
    <div style={{ background: '#eeeaff', borderRadius: 10, overflow: 'hidden', lineHeight: 0 }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 118, center: [10, 22] }}
        width={760}
        height={380}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const id   = String(geo.id);
              const fill = COUNTRY_FILL[id] ?? '#d8d0f8';
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', fill: COUNTRY_FILL[id] ? fill : '#c4b5fd', cursor: 'default' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 8px', background: '#eeeaff' }}>
        <span style={{ fontSize: 9, color: '#94a3b8' }}>Low</span>
        <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'linear-gradient(90deg, #ede9fe, #7c3aed)' }} />
        <span style={{ fontSize: 9, color: '#94a3b8' }}>High</span>
      </div>
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const d = Math.round(v * 0.048);
  return (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '12px 16px', border: '1px solid #ede9fe', minWidth: 165 }}>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{v >= 1000 ? `${(v/1000).toFixed(1)}K` : v} Total Audience</div>
      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>↑ {d >= 1000 ? `${(d/1000).toFixed(1)}K` : d} vs prev</div>
    </div>
  );
}

// ── AudiencePanel ─────────────────────────────────────────────────────────────

export function AudiencePanel() {
  const [chartRange,  setChartRange]  = useState<'Daily'|'Weekly'|'Monthly'>('Daily');
  const [showChartDd, setShowChartDd] = useState(false);
  const chartData = GROWTH_DATA[chartRange];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Audience Overview</h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Understand your audience growth and demographics</p>
      </div>

      {/* 4 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: <Users      size={16} color="#7c3aed" />, bg: 'rgba(124,58,237,0.10)',  label: 'Total Audience',  val: '89.7K', change: '+21%' },
          { icon: <TrendingUp size={16} color="#10b981" />, bg: 'rgba(16,185,129,0.10)',  label: 'New Audience',    val: '12.4K', change: '+18%' },
          { icon: <Zap        size={16} color="#f59e0b" />, bg: 'rgba(245,158,11,0.10)',  label: 'Engagement Rate', val: '4.8%',  change: '+12%' },
          { icon: <Star       size={16} color="#f87171" />, bg: 'rgba(248,113,113,0.10)', label: 'Loyal Followers', val: '34.2K', change: '+15%' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '13px 14px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, lineHeight: 1.2 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.val}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>↑ {card.change}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>vs last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Audience by Geography */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Audience by Geography</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* World map */}
          <div style={{ flex: '0 0 58%' }}>
            <GeoWorldMap />
          </div>

          {/* Country table */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f1f0ff' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Country</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience</span>
            </div>
            {GEO_ROWS.map(row => (
              <div key={row.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f8f7ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{row.country}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{row.value}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 28, textAlign: 'right' }}>{row.pct}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Growth chart */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Audience Growth</h3>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowChartDd(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#f8f7ff', border: '1.5px solid #ede9fe', borderRadius: 8, fontSize: 12, color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
              {chartRange} <ChevronDown size={12} />
            </button>
            {showChartDd && (
              <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', border: '1px solid #ede9fe', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 120, overflow: 'hidden' }}>
                {(['Daily','Weekly','Monthly'] as const).map(r => (
                  <div key={r}
                    onClick={() => { setChartRange(r); setShowChartDd(false); }}
                    style={{ padding: '8px 14px', fontSize: 12, color: r === chartRange ? '#7c3aed' : '#374151', fontWeight: r === chartRange ? 700 : 400, cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8f7ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'none'; }}>
                    {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={165}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="agGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ff" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis
              ticks={[0, 25000, 50000, 75000, 100000]}
              tickFormatter={(v: number) => v === 0 ? '0' : `${v / 1000}K`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2.5} fill="url(#agGrad)" dot={false} activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── TopPerformingPanel ────────────────────────────────────────────────────────

export function TopPerformingPanel() {
  const [activeTab, setActiveTab] = useState('all');
  const filtered = activeTab === 'all' ? TOP_CONTENT : TOP_CONTENT.filter(c => c.platform === activeTab);

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)', padding: '18px 18px 14px', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Top Performing Content</h2>
        <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: '#7c3aed', cursor: 'pointer', padding: 0, flexShrink: 0 }}>View all</button>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: 11, color: '#94a3b8' }}>Your best performing posts across all platforms</p>

      {/* Platform tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {PLATFORM_TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: active ? '#ede9fe' : '#f8f7ff', border: `1.5px solid ${active ? '#c4b5fd' : '#f1f0ff'}`, color: active ? '#7c3aed' : '#64748b', fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s' }}>
              {tab.key !== 'all' && <PlatformIcon platform={tab.key} size={11} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>No content for this platform.</div>
        ) : filtered.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < filtered.length - 1 ? '1px solid #f8f7ff' : 'none' }}>

            {/* Thumbnail */}
            <div style={{ width: 62, height: 50, borderRadius: 9, overflow: 'hidden', flexShrink: 0, position: 'relative', background: '#1e293b', cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={8} color="#7c3aed" fill="#7c3aed" style={{ marginLeft: 1 }} />
                </div>
              </div>
            </div>

            {/* Title + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <PlatformIcon platform={item.platform} size={11} />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>{item.type}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }}>{item.title}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{item.date}</div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'center' }}>
              {[
                { label: 'Reach',      val: item.reach },
                { label: 'Eng.',       val: item.engagement },
                { label: 'ER',         val: item.er },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', minWidth: 32 }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{m.val}</div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Heart size={10} color="#f87171" fill="#f87171" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{item.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ paddingTop: 10, borderTop: '1px solid #f1f0ff', marginTop: 4, textAlign: 'center' }}>
        <button style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          📊 See all content analytics →
        </button>
      </div>
    </div>
  );
}

// ── BottomPanels (legacy combined — keep for compat) ──────────────────────────

export function BottomPanels() {
  return (
    <div style={{ display: 'flex', gap: 18, padding: '0 28px 28px', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ flex: '0 0 54%', minWidth: 0 }}>
        <AudiencePanel />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <TopPerformingPanel />
      </div>
    </div>
  );
}
