'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Plus, Search, MoreVertical, Pencil, Trash2, Pause, Play,
  X, CheckCircle2, Target, TrendingUp, Users, Zap, Sparkles,
  ChevronRight, Calendar, DollarSign, BarChart2, Globe,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  InstagramIcon, FacebookIcon, LinkedinIcon, TikTokIcon, XIcon, YoutubeIcon,
} from '@/components/ui/platform-icons';
import type { FC } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'completed';
type CampaignStatus = 'active' | 'paused' | 'draft' | 'completed';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  reach: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  platforms: string[];
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface IconProps { size?: number; color?: string; }

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Active',    color: '#059669', bg: '#ecfdf5' },
  paused:    { label: 'Paused',    color: '#d97706', bg: '#fffbeb' },
  draft:     { label: 'Draft',     color: '#64748b', bg: '#f8fafc' },
  completed: { label: 'Completed', color: '#3b82f6', bg: '#eff6ff' },
};

const PLATFORMS_META: { key: string; label: string; color: string; bg: string; Icon: FC<IconProps> }[] = [
  { key: 'instagram', label: 'Instagram', color: '#e1306c', bg: '#fce4ec', Icon: InstagramIcon },
  { key: 'facebook',  label: 'Facebook',  color: '#1877f2', bg: '#e8f0fe', Icon: FacebookIcon  },
  { key: 'linkedin',  label: 'LinkedIn',  color: '#0077b5', bg: '#e3f2fd', Icon: LinkedinIcon  },
  { key: 'tiktok',    label: 'TikTok',    color: '#333',    bg: '#f3f4f6', Icon: TikTokIcon    },
  { key: 'x',         label: 'X',         color: '#000',    bg: '#f3f4f6', Icon: XIcon         },
  { key: 'youtube',   label: 'YouTube',   color: '#ff0000', bg: '#ffebee', Icon: YoutubeIcon   },
];

const CAMPAIGN_TYPES = [
  { key: 'awareness',   label: 'Awareness',   icon: Globe,      desc: 'Maximize brand visibility'     },
  { key: 'traffic',     label: 'Traffic',     icon: TrendingUp, desc: 'Drive website visits'           },
  { key: 'conversions', label: 'Conversions', icon: Target,     desc: 'Generate leads & sales'         },
  { key: 'engagement',  label: 'Engagement',  icon: Users,      desc: 'Boost interactions & shares'   },
];

const DEMO_CAMPAIGNS: Campaign[] = [
  { id: 'd1', name: 'Summer Sale 2024',    description: 'Promote our summer collection across all platforms with focus on Instagram and Facebook.', status: 'active',    budget: 4200,  spent: 2100, reach: 84000,  impressions: 220000, clicks: 3528, conversions: 142, ctr: 4.2, platforms: ['instagram','facebook'], start_date: '2024-06-01', end_date: '2024-06-30', created_at: '2024-05-28' },
  { id: 'd2', name: 'Brand Awareness Q2',  description: 'Quarterly brand awareness push to reach new audience segments on LinkedIn and Instagram.', status: 'active',    budget: 8000,  spent: 5600, reach: 240000, impressions: 580000, clicks: 6720, conversions: 380, ctr: 2.8, platforms: ['instagram','linkedin'],  start_date: '2024-04-01', end_date: '2024-06-30', created_at: '2024-03-25' },
  { id: 'd3', name: 'Product Launch',      description: 'New product line launch campaign targeting younger demographic on TikTok and Facebook.',   status: 'paused',    budget: 12000, spent: 3200, reach: 47000,  impressions: 142000, clicks: 1457, conversions:  89, ctr: 3.1, platforms: ['facebook','tiktok'],    start_date: '2024-05-15', end_date: '2024-07-15', created_at: '2024-05-10' },
  { id: 'd4', name: 'Holiday Campaign',    description: 'End of year holiday sale targeting existing customers and lookalike audiences.',            status: 'draft',     budget: 6500,  spent: 0,    reach: 0,      impressions: 0,      clicks: 0,    conversions:   0, ctr: 0,   platforms: ['instagram'],             start_date: '2024-11-25', end_date: '2024-12-31', created_at: '2024-05-01' },
  { id: 'd5', name: 'Influencer Collab Q3', description: 'Collaboration with micro-influencers for authentic product reviews and unboxing content.',  status: 'completed', budget: 3500,  spent: 3480, reach: 126000, impressions: 310000, clicks: 4410, conversions: 201, ctr: 3.5, platforms: ['instagram','youtube','tiktok'], start_date: '2024-01-01', end_date: '2024-03-31', created_at: '2023-12-20' },
];

// Demo reach trend for detail panel
const REACH_TREND = [
  { day: 'Day 1', reach: 2100 }, { day: 'Day 3', reach: 4800 }, { day: 'Day 5', reach: 7200 },
  { day: 'Day 7', reach: 11000 }, { day: 'Day 10', reach: 18000 }, { day: 'Day 14', reach: 24000 },
  { day: 'Day 18', reach: 31000 }, { day: 'Day 21', reach: 38000 }, { day: 'Day 25', reach: 44000 },
  { day: 'Day 30', reach: 52000 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBudget(n: number): string {
  return '$' + n.toLocaleString();
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
  return String(n);
}
function pct(spent: number, budget: number): number {
  if (!budget) return 0;
  return Math.min(100, Math.round((spent / budget) * 100));
}
function getPlatform(key: string) {
  return PLATFORMS_META.find(p => p.key === key) ?? PLATFORMS_META[0];
}

// ── SpentBar ──────────────────────────────────────────────────────────────────

function SpentBar({ spent, budget }: { spent: number; budget: number }) {
  const p = pct(spent, budget);
  const color = p > 80 ? '#ef4444' : p > 60 ? '#f59e0b' : '#7c3aed';
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{fmtBudget(spent)}</div>
      <div style={{ height: 5, background: '#f1f0ff', borderRadius: 10, overflow: 'hidden', width: 90 }}>
        <div style={{ height: '100%', width: p + '%', background: color, borderRadius: 10, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{p}% of {fmtBudget(budget)}</div>
    </div>
  );
}

// ── New Campaign Modal ────────────────────────────────────────────────────────

interface ModalForm {
  name: string; description: string; type: string;
  platforms: string[]; budget: string; allocation: Record<string, string>;
  startDate: string; endDate: string;
  targetReach: string; targetConversions: string;
}

function NewCampaignModal({
  onClose, onSaved, editCampaign,
}: { onClose: () => void; onSaved: (c: Campaign) => void; editCampaign?: Campaign | null }) {
  const [step, setStep]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError]   = useState('');
  const [form, setForm]     = useState<ModalForm>({
    name:               editCampaign?.name ?? '',
    description:        editCampaign?.description ?? '',
    type:               'awareness',
    platforms:          editCampaign?.platforms ?? [],
    budget:             editCampaign ? String(editCampaign.budget) : '',
    allocation:         {},
    startDate:          editCampaign?.start_date ?? '',
    endDate:            editCampaign?.end_date ?? '',
    targetReach:        editCampaign ? String(editCampaign.reach) : '',
    targetConversions:  editCampaign ? String(editCampaign.conversions) : '',
  });

  const up = (k: keyof ModalForm, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const togglePlatform = (key: string) => {
    const next = form.platforms.includes(key) ? form.platforms.filter(k => k !== key) : [...form.platforms, key];
    up('platforms', next);
    const bud = parseFloat(form.budget) || 0;
    const alloc: Record<string, string> = {};
    next.forEach(p => alloc[p] = bud > 0 ? String(Math.round(bud / next.length)) : '');
    up('allocation', alloc);
  };

  const autoAlloc = () => {
    const bud = parseFloat(form.budget) || 0;
    const alloc: Record<string, string> = {};
    form.platforms.forEach(p => alloc[p] = bud > 0 ? String(Math.round(bud / form.platforms.length)) : '0');
    up('allocation', alloc);
  };

  const aiOptimize = async () => {
    setAiLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    // Demo AI allocation: weight by platform performance
    const weights: Record<string, number> = { instagram: 35, facebook: 25, tiktok: 20, linkedin: 15, x: 3, youtube: 2 };
    const total = form.platforms.reduce((s, p) => s + (weights[p] ?? 10), 0);
    const bud = parseFloat(form.budget) || 0;
    const alloc: Record<string, string> = {};
    form.platforms.forEach(p => alloc[p] = String(Math.round(bud * (weights[p] ?? 10) / total)));
    up('allocation', alloc);
    setAiLoading(false);
  };

  const handleSubmit = async (launch: boolean) => {
    if (!form.name.trim()) { setError('Campaign name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(), description: form.description,
        status: launch ? 'active' : 'draft',
        budget: parseFloat(form.budget) || 0,
        platforms: form.platforms,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        reach: parseInt(form.targetReach) || 0,
        conversions: parseInt(form.targetConversions) || 0,
        ...(editCampaign ? { id: editCampaign.id } : {}),
      };
      const res = await fetch('/api/campaigns', {
        method: editCampaign ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return; }
      onSaved(json.campaign);
      onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const steps = ['Basic Info', 'Platforms & Budget', 'Goals', 'Review'];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 22, width: '100%', maxWidth: 640, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: '22px 26px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>{editCampaign ? 'Edit Campaign' : 'New Campaign'}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Step {step} of 4 — {steps[step - 1]}</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}><X size={16} /></button>
        </div>

        {/* Step dots */}
        <div style={{ padding: '16px 26px 0', display: 'flex', gap: 6 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, cursor: i + 1 < step ? 'pointer' : 'default', background: i + 1 === step ? '#7c3aed' : i + 1 < step ? '#ede9fe' : '#f1f5f9', color: i + 1 === step ? '#fff' : i + 1 < step ? '#7c3aed' : '#94a3b8' }}
                onClick={() => i + 1 < step && setStep(i + 1)}>
                {i + 1 < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: i + 1 === step ? '#7c3aed' : '#94a3b8', whiteSpace: 'nowrap' }}>{s}</span>
              {i < 3 && <div style={{ flex: 1, height: 2, background: i + 1 < step ? '#7c3aed' : '#e2e8f0', borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        <div style={{ padding: '20px 26px 26px' }}>

          {/* ── Step 1: Basic Info ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Campaign Name *</label>
                <input value={form.name} onChange={e => up('name', e.target.value)} placeholder="e.g. Summer Sale 2024" style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Description</label>
                <textarea value={form.description} onChange={e => up('description', e.target.value)} placeholder="What is this campaign about?" rows={3} style={{ width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '12px 14px', fontSize: 14, color: '#1e293b', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Campaign Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CAMPAIGN_TYPES.map(t => {
                    const sel = form.type === t.key;
                    return (
                      <button key={t.key} onClick={() => up('type', t.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12, border: sel ? '2px solid #7c3aed' : '2px solid #e2e8f0', background: sel ? '#f5f3ff' : '#fafaf9', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: sel ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <t.icon size={18} color={sel ? '#7c3aed' : '#94a3b8'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#7c3aed' : '#1e293b' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}
              <button onClick={() => { if (!form.name.trim()) { setError('Name required'); return; } setError(''); setStep(2); }} style={{ height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Platforms & Budget ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>Select Platforms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PLATFORMS_META.map(p => {
                    const sel = form.platforms.includes(p.key);
                    return (
                      <button key={p.key} onClick={() => togglePlatform(p.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: sel ? `2px solid ${p.color}` : '2px solid #e2e8f0', background: sel ? p.bg : '#fafaf9', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: sel ? p.color : '#64748b', transition: 'all 0.15s' }}>
                        <p.Icon size={13} color={sel ? p.color : '#94a3b8'} /> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Total Budget (USD)</label>
                <div style={{ position: 'relative' }}>
                  <DollarSign size={15} color="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="number" value={form.budget} onChange={e => { up('budget', e.target.value); autoAlloc(); }} placeholder="5000" style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px 0 38px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
                </div>
              </div>
              {form.platforms.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Budget Allocation</label>
                    <button onClick={autoAlloc} style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, background: '#f5f3ff', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Auto-split equally</button>
                  </div>
                  {form.platforms.map(pk => {
                    const p = getPlatform(pk);
                    return (
                      <div key={pk} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <p.Icon size={13} color={p.color} />
                        </div>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#475569' }}>{p.label}</span>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94a3b8' }}>$</span>
                          <input type="number" value={form.allocation[pk] ?? ''} onChange={e => up('allocation', { ...form.allocation, [pk]: e.target.value })} style={{ width: 100, height: 36, borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '0 10px 0 22px', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => up('startDate', e.target.value)} style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => up('endDate', e.target.value)} min={form.startDate} style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, height: 46, borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => { if (form.platforms.length === 0) { setError('Select at least one platform'); return; } setError(''); setStep(3); }} style={{ flex: 2, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continue →</button>
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}
            </div>
          )}

          {/* ── Step 3: Goals ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Target Reach</label>
                  <input type="number" value={form.targetReach} onChange={e => up('targetReach', e.target.value)} placeholder="100000" style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>People who will see your content</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>Target Conversions</label>
                  <input type="number" value={form.targetConversions} onChange={e => up('targetConversions', e.target.value)} placeholder="500" style={{ width: '100%', height: 46, borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fafaf9' }} />
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Clicks, signups, or purchases</div>
                </div>
              </div>

              {/* AI Optimize */}
              <div style={{ background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderRadius: 14, padding: 18, border: '1.5px solid #ddd6fe' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={17} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>AI Budget Optimizer</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>Let AI analyze your goals and automatically allocate your budget for maximum ROI across selected platforms.</div>
                    <button onClick={aiOptimize} disabled={aiLoading || form.platforms.length === 0 || !form.budget} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: aiLoading ? '#a78bfa' : '#7c3aed', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: aiLoading || form.platforms.length === 0 || !form.budget ? 'not-allowed' : 'pointer', opacity: form.platforms.length === 0 || !form.budget ? 0.5 : 1 }}>
                      <Zap size={14} /> {aiLoading ? 'Optimizing…' : 'AI Optimize Budget'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, height: 46, borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(4)} style={{ flex: 2, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Review & Launch →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fafaf9', borderRadius: 14, padding: 18, border: '1px solid #f1f0ff', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Campaign Name',  value: form.name || '—' },
                  { label: 'Type',           value: CAMPAIGN_TYPES.find(t => t.key === form.type)?.label ?? '—' },
                  { label: 'Total Budget',   value: form.budget ? fmtBudget(parseFloat(form.budget)) : '—' },
                  { label: 'Platforms',      value: form.platforms.length > 0 ? form.platforms.map(p => getPlatform(p).label).join(', ') : '—' },
                  { label: 'Duration',       value: form.startDate && form.endDate ? `${form.startDate} → ${form.endDate}` : '—' },
                  { label: 'Target Reach',   value: form.targetReach ? fmtNum(parseInt(form.targetReach)) : '—' },
                  { label: 'Target Convs.',  value: form.targetConversions || '—' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f0ff' }}>
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', textAlign: 'right', maxWidth: 280 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(3)} style={{ flex: 1, height: 46, borderRadius: 12, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                <button onClick={() => handleSubmit(false)} disabled={saving} style={{ flex: 1, height: 46, borderRadius: 12, border: '1.5px solid #7c3aed', background: '#fff', color: '#7c3aed', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Draft</button>
                <button onClick={() => handleSubmit(true)} disabled={saving} style={{ flex: 2, height: 46, borderRadius: 12, background: saving ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#a855f7)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving…' : '🚀 Launch Campaign'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Campaign Detail Panel ─────────────────────────────────────────────────────

function DetailPanel({
  campaign, onClose, onUpdate, onDelete,
}: { campaign: Campaign; onClose: () => void; onUpdate: (c: Campaign) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(campaign.name);
  const [desc, setDesc]       = useState(campaign.description);
  const [saving, setSaving]   = useState(false);

  const st = STATUS_META[campaign.status];

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id, name, description: desc }) });
      const json = await res.json();
      if (res.ok) { onUpdate(json.campaign); setEditing(false); }
    } finally { setSaving(false); }
  };

  const toggleStatus = async () => {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id, status: next }) });
    const json = await res.json();
    if (res.ok) onUpdate(json.campaign);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${campaign.name}"?`)) return;
    if (campaign.id.startsWith('d')) { onDelete(campaign.id); return; }
    await fetch(`/api/campaigns?id=${campaign.id}`, { method: 'DELETE' });
    onDelete(campaign.id);
  };

  const spentPct = pct(campaign.spent, campaign.budget);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.3)' }} />
      <div style={{ position: 'relative', width: 420, height: '100%', background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', overflowY: 'auto', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.25s ease' }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:none}}`}</style>

        {/* Panel header */}
        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid #f1f0ff', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              {editing ? (
                <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', fontSize: 16, fontWeight: 800, color: '#0f172a', border: '1.5px solid #7c3aed', borderRadius: 8, padding: '5px 10px', outline: 'none' }} />
              ) : (
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, cursor: 'pointer' }} onClick={() => setEditing(true)}>{campaign.name}</h3>
              )}
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}><X size={15} /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
            {campaign.platforms.slice(0, 4).map(pk => {
              const p = getPlatform(pk);
              return <div key={pk} style={{ width: 22, height: 22, borderRadius: 6, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p.Icon size={11} color={p.color} /></div>;
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Description */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
            {editing ? (
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ width: '100%', borderRadius: 10, border: '1.5px solid #7c3aed', padding: '10px 12px', fontSize: 13, color: '#1e293b', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6, cursor: 'pointer' }} onClick={() => setEditing(true)}>{campaign.description || 'Click to add description…'}</p>
            )}
            {editing && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button onClick={save} disabled={saving} style={{ flex: 1, height: 36, borderRadius: 10, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Changes'}</button>
                <button onClick={() => { setEditing(false); setName(campaign.name); setDesc(campaign.description); }} style={{ flex: 1, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total Reach',  value: fmtNum(campaign.reach) },
              { label: 'Impressions',  value: fmtNum(campaign.impressions) },
              { label: 'Clicks',       value: fmtNum(campaign.clicks) },
              { label: 'Conversions',  value: String(campaign.conversions) },
              { label: 'CTR',          value: campaign.ctr + '%' },
              { label: 'Platforms',    value: String(campaign.platforms.length) },
            ].map(s => (
              <div key={s.label} style={{ background: '#fafaf9', borderRadius: 12, padding: '12px 14px', border: '1px solid #f1f0ff' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{s.value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Budget progress */}
          <div style={{ background: '#fafaf9', borderRadius: 14, padding: 16, border: '1px solid #f1f0ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Budget Usage</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: spentPct > 80 ? '#ef4444' : '#7c3aed' }}>{spentPct}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: spentPct + '%', background: spentPct > 80 ? '#ef4444' : spentPct > 60 ? '#f59e0b' : '#7c3aed', borderRadius: 10, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Spent: <strong>{fmtBudget(campaign.spent)}</strong></span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Budget: <strong>{fmtBudget(campaign.budget)}</strong></span>
            </div>
          </div>

          {/* Platform breakdown */}
          {campaign.platforms.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Breakdown</div>
              {campaign.platforms.map((pk, i) => {
                const p = getPlatform(pk);
                const share = Math.round(100 / campaign.platforms.length);
                const pSpent = Math.round(campaign.spent * share / 100);
                return (
                  <div key={pk} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < campaign.platforms.length - 1 ? '1px solid #f8f7ff' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><p.Icon size={13} color={p.color} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{p.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{fmtBudget(pSpent)}</span>
                      </div>
                      <div style={{ height: 4, background: '#f1f0ff', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: share + '%', background: p.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reach trend chart */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reach Timeline</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={REACH_TREND} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtNum(v)} />
                <Tooltip formatter={(v) => [fmtNum(Number(v)), 'Reach']} contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 11 }} />
                <Line type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Dates */}
          {(campaign.start_date || campaign.end_date) && (
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ label: 'Start', value: campaign.start_date }, { label: 'End', value: campaign.end_date }].map(d => d.value && (
                <div key={d.label} style={{ flex: 1, background: '#fafaf9', borderRadius: 12, padding: '12px 14px', border: '1px solid #f1f0ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={14} color="#7c3aed" />
                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{d.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f0ff', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={toggleStatus} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {campaign.status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
          </button>
          <button onClick={handleDelete} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 10, border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<StatusFilter>('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Campaign | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [dropdown, setDropdown]     = useState<string | null>(null);
  const dropdownRef                 = useRef<HTMLDivElement>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const json = await res.json();
      setCampaigns(json.campaigns?.length > 0 ? json.campaigns : DEMO_CAMPAIGNS);
    } catch { setCampaigns(DEMO_CAMPAIGNS); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdown(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = useMemo(() => campaigns.filter(c => {
    const matchStatus = filter === 'all' || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [campaigns, filter, search]);

  const activeCnt = campaigns.filter(c => c.status === 'active').length;

  const handleSaved = (c: Campaign) => {
    setCampaigns(prev => {
      const exists = prev.find(p => p.id === c.id);
      return exists ? prev.map(p => p.id === c.id ? c : p) : [c, ...prev];
    });
    if (selected?.id === c.id) setSelected(c);
  };

  const handleDelete = async (id: string) => {
    if (!id.startsWith('d')) await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
    setCampaigns(p => p.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    setDropdown(null);
  };

  const toggleStatus = async (campaign: Campaign) => {
    const next = campaign.status === 'active' ? 'paused' : 'active';
    if (!campaign.id.startsWith('d')) {
      const res = await fetch('/api/campaigns', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id, status: next }) });
      const json = await res.json();
      if (res.ok) handleSaved(json.campaign);
    } else {
      handleSaved({ ...campaign, status: next as CampaignStatus });
    }
    setDropdown(null);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .campaigns-fade{animation:fadeUp 0.3s ease both}
        .campaign-row{transition:background 0.1s;cursor:pointer}
        .campaign-row:hover{background:#fafaf9!important}
        .tab-pill:hover{opacity:0.8}
      `}</style>

      <div className="campaigns-fade" style={{ padding: '0 28px 32px' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>Campaigns</h2>
            {activeCnt > 0 && <span style={{ background: '#ecfdf5', color: '#059669', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>{activeCnt} active</span>}
          </div>
          <button onClick={() => { setEditCampaign(null); setShowModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            <Plus size={15} /> New Campaign
          </button>
        </div>

        {/* ── Filter + Search ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 }}>
            {(['all','active','paused','draft','completed'] as StatusFilter[]).map(s => (
              <button key={s} className="tab-pill" onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', background: filter === s ? '#fff' : 'transparent', color: filter === s ? '#7c3aed' : '#94a3b8', boxShadow: filter === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7 }}>({campaigns.filter(c => c.status === s).length})</span>}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, maxWidth: 300, position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns…" style={{ width: '100%', height: 38, borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '0 14px 0 34px', fontSize: 13, color: '#1e293b', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f0ff', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

          {loading ? (
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: 56, borderRadius: 10, background: 'linear-gradient(90deg,#f1f0ff 25%,#e8e6ff 50%,#f1f0ff 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />)}
              <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '72px 24px', textAlign: 'center' }}>
              <BarChart2 size={48} color="#c4b5fd" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                {search ? 'No campaigns match your search' : 'No campaigns yet'}
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
                {search ? 'Try a different search term or clear the filter.' : 'Create your first campaign to start reaching your audience.'}
              </div>
              {!search && (
                <button onClick={() => { setEditCampaign(null); setShowModal(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={14} /> Create your first campaign
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafaf9' }}>
                    {['Campaign','Status','Platforms','Budget','Spent','Reach','CTR','Dates','Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => {
                    const st = STATUS_META[c.status];
                    const isSelected = selected?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        className="campaign-row"
                        onClick={() => setSelected(isSelected ? null : c)}
                        style={{ borderTop: '1px solid #f8f7ff', background: isSelected ? '#faf8ff' : idx % 2 === 0 ? '#fff' : 'transparent' }}
                      >
                        {/* Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                            {isSelected && <ChevronRight size={13} color="#7c3aed" />}
                          </div>
                        </td>
                        {/* Status */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                        </td>
                        {/* Platforms */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {c.platforms.slice(0, 3).map(pk => {
                              const p = getPlatform(pk);
                              return <div key={pk} style={{ width: 22, height: 22, borderRadius: 6, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p.Icon size={11} color={p.color} /></div>;
                            })}
                            {c.platforms.length > 3 && <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f1f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#7c3aed' }}>+{c.platforms.length - 3}</div>}
                          </div>
                        </td>
                        {/* Budget */}
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{fmtBudget(c.budget)}</td>
                        {/* Spent */}
                        <td style={{ padding: '14px 16px' }}><SpentBar spent={c.spent} budget={c.budget} /></td>
                        {/* Reach */}
                        <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{c.reach > 0 ? fmtNum(c.reach) : '—'}</td>
                        {/* CTR */}
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: c.ctr >= 4 ? '#f5f3ff' : '#f8fafc', color: c.ctr >= 4 ? '#7c3aed' : '#64748b' }}>{c.ctr > 0 ? c.ctr + '%' : '—'}</span>
                        </td>
                        {/* Dates */}
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          {c.start_date ? (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.start_date.slice(5)} → {c.end_date?.slice(5) ?? '…'}</span>
                          ) : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ position: 'relative' }} ref={dropdown === c.id ? dropdownRef : undefined}>
                            <button onClick={() => setDropdown(dropdown === c.id ? null : c.id)} style={{ width: 32, height: 32, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                              <MoreVertical size={15} />
                            </button>
                            {dropdown === c.id && (
                              <div style={{ position: 'absolute', right: 0, top: 36, zIndex: 200, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.14)', border: '1px solid #f1f0ff', minWidth: 160, overflow: 'hidden' }}>
                                {[
                                  { icon: Pencil, label: 'Edit', action: () => { setEditCampaign(c); setShowModal(true); setDropdown(null); }, color: '#475569' },
                                  { icon: c.status === 'active' ? Pause : Play, label: c.status === 'active' ? 'Pause' : 'Resume', action: () => toggleStatus(c), color: '#f59e0b' },
                                  { icon: Trash2, label: 'Delete', action: () => handleDelete(c.id), color: '#ef4444' },
                                ].map(item => (
                                  <button key={item.label} onClick={item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: item.color, textAlign: 'left' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#fafaf9')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                  >
                                    <item.icon size={14} /> {item.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          campaign={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleSaved}
          onDelete={handleDelete}
        />
      )}

      {/* New/Edit modal */}
      {showModal && (
        <NewCampaignModal
          onClose={() => { setShowModal(false); setEditCampaign(null); }}
          onSaved={handleSaved}
          editCampaign={editCampaign}
        />
      )}
    </>
  );
}
