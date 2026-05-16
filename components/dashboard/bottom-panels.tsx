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
// No hardcoded demo data — real data loads from Supabase via API routes.
// Empty arrays / null values produce clean "connect your accounts" states.

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

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
      <div style={{ marginBottom: 10, opacity: 0.35 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12 }}>{subtitle}</div>
    </div>
  );
}

export function AudiencePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Audience Overview</h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94a3b8' }}>Understand your audience growth and demographics</p>
      </div>

      {/* 4 KPI cards — show dashes until real data arrives */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: <Users      size={16} color="#7c3aed" />, bg: 'rgba(124,58,237,0.10)',  label: 'Total Audience'  },
          { icon: <TrendingUp size={16} color="#10b981" />, bg: 'rgba(16,185,129,0.10)',  label: 'New Audience'    },
          { icon: <Zap        size={16} color="#f59e0b" />, bg: 'rgba(245,158,11,0.10)',  label: 'Engagement Rate' },
          { icon: <Star       size={16} color="#f87171" />, bg: 'rgba(248,113,113,0.10)', label: 'Loyal Followers' },
        ].map(card => (
          <div key={card.label} style={{ background: '#fff', borderRadius: 12, padding: '13px 14px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, lineHeight: 1.2 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#cbd5e1', lineHeight: 1 }}>—</div>
            <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>Connect accounts</div>
          </div>
        ))}
      </div>

      {/* Audience by Geography */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Audience by Geography</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* World map — always shown as a visual */}
          <div style={{ flex: '0 0 58%' }}>
            <GeoWorldMap />
          </div>
          {/* Country table empty state */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f1f0ff' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Country</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Audience</span>
            </div>
            <EmptyState
              icon={<Users size={26} />}
              title="No geographic data yet"
              subtitle="Connect your social accounts to see where your audience is located"
            />
          </div>
        </div>
      </div>

      {/* Audience Growth — empty state */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', border: '1px solid #f1f0ff', boxShadow: '0 1px 4px rgba(124,58,237,0.05)' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Audience Growth</h3>
        <EmptyState
          icon={<TrendingUp size={28} />}
          title="No growth data yet"
          subtitle="Your audience growth chart will appear after connecting social accounts"
        />
      </div>
    </div>
  );
}

// ── TopPerformingPanel ────────────────────────────────────────────────────────

interface ContentItem { platform: string; type: string; title: string; date: string; reach: string; engagement: string; er: string; likes: string; img: string; }

export function TopPerformingPanel() {
  const [activeTab, setActiveTab] = useState('all');
  // No demo data — real content loads from API once social accounts are connected
  const filtered: ContentItem[] = [];
  void activeTab; // tab filtering applies once real data is wired up

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
