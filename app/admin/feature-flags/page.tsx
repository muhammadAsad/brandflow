'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, Edit2, Users, ChevronDown, ChevronUp, X, Check, AlertCircle } from 'lucide-react';

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled_globally: boolean;
  enabled_for_plans: string[];
  rollout_percentage: number;
  override_count?: number;
  updated_at: string;
}

interface UserOverride {
  id: string;
  user_id: string;
  is_enabled: boolean;
  reason: string | null;
  created_at: string;
  profiles?: { email: string; full_name: string | null };
}

const PLAN_OPTIONS = ['free', 'pro', 'enterprise'];
const PLAN_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  free:       { text: '#9ca3af', bg: 'rgba(156,163,175,0.12)', border: 'rgba(156,163,175,0.3)' },
  pro:        { text: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  enterprise: { text: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
};

const DEMO_FLAGS: FeatureFlag[] = [
  { id: 'f1', key: 'social_planner',     name: 'Social Planner',        description: 'Schedule posts to social platforms',    is_enabled_globally: true,  enabled_for_plans: ['free','pro','enterprise'], rollout_percentage: 100, override_count: 2,  updated_at: new Date(Date.now()-3600000).toISOString() },
  { id: 'f2', key: 'ai_insights',        name: 'AI Insights',           description: 'AI-generated performance insights',     is_enabled_globally: true,  enabled_for_plans: ['pro','enterprise'],         rollout_percentage: 100, override_count: 5,  updated_at: new Date(Date.now()-7200000).toISOString() },
  { id: 'f3', key: 'automation',         name: 'Automation Workflows',  description: 'Build automated marketing workflows',   is_enabled_globally: true,  enabled_for_plans: ['pro','enterprise'],         rollout_percentage: 80,  override_count: 3,  updated_at: new Date(Date.now()-86400000).toISOString() },
  { id: 'f4', key: 'crm_contacts',       name: 'CRM Contacts',          description: 'Manage leads and customers',            is_enabled_globally: true,  enabled_for_plans: ['free','pro','enterprise'], rollout_percentage: 100, override_count: 0,  updated_at: new Date(Date.now()-172800000).toISOString() },
  { id: 'f5', key: 'analytics_advanced', name: 'Advanced Analytics',    description: 'Deep analytics with chart breakdowns',  is_enabled_globally: true,  enabled_for_plans: ['pro','enterprise'],         rollout_percentage: 100, override_count: 1,  updated_at: new Date(Date.now()-259200000).toISOString() },
  { id: 'f6', key: 'conversations',      name: 'Conversations Inbox',   description: 'Unified social DM inbox',               is_enabled_globally: false, enabled_for_plans: ['pro','enterprise'],         rollout_percentage: 50,  override_count: 8,  updated_at: new Date(Date.now()-345600000).toISOString() },
  { id: 'f7', key: 'white_label',        name: 'White Label',           description: 'Custom branding and domain',            is_enabled_globally: false, enabled_for_plans: ['enterprise'],              rollout_percentage: 100, override_count: 2,  updated_at: new Date(Date.now()-432000000).toISOString() },
  { id: 'f8', key: 'api_access',         name: 'API Access',            description: 'Direct API access for integrations',   is_enabled_globally: true,  enabled_for_plans: ['pro','enterprise'],         rollout_percentage: 100, override_count: 0,  updated_at: new Date(Date.now()-518400000).toISOString() },
];

const DEMO_OVERRIDES: UserOverride[] = [
  { id: 'o1', user_id: 'u1', is_enabled: true,  reason: 'Beta tester',    created_at: new Date(Date.now()-3600000).toISOString(), profiles: { email: 'alice@example.com', full_name: 'Alice Johnson' } },
  { id: 'o2', user_id: 'u2', is_enabled: false, reason: 'Grandfathered',  created_at: new Date(Date.now()-7200000).toISOString(), profiles: { email: 'bob@example.com',   full_name: 'Bob Smith' } },
  { id: 'o3', user_id: 'u3', is_enabled: true,  reason: 'Trial extended', created_at: new Date(Date.now()-86400000).toISOString(), profiles: { email: 'carol@example.com', full_name: 'Carol Davis' } },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', display: 'inline-flex', width: 44, height: 24,
        borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background 0.2s',
        background: checked ? '#8b5cf6' : 'rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </button>
  );
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<UserOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);

  const [newFlag, setNewFlag] = useState({
    key: '', name: '', description: '',
    is_enabled_globally: false,
    enabled_for_plans: ['pro', 'enterprise'],
    rollout_percentage: 100,
  });

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feature-flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags?.length ? data.flags : DEMO_FLAGS);
      } else {
        setFlags(DEMO_FLAGS);
      }
    } catch {
      setFlags(DEMO_FLAGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const toggleExpand = async (key: string) => {
    if (expandedKey === key) { setExpandedKey(null); return; }
    setExpandedKey(key);
    setOverridesLoading(true);
    try {
      const res = await fetch(`/api/admin/feature-flags/${key}/overrides`);
      if (res.ok) {
        const data = await res.json();
        setOverrides(data.overrides?.length ? data.overrides : DEMO_OVERRIDES);
      } else {
        setOverrides(DEMO_OVERRIDES);
      }
    } catch {
      setOverrides(DEMO_OVERRIDES);
    } finally {
      setOverridesLoading(false);
    }
  };

  const updateFlag = async (flag: FeatureFlag, patch: Partial<FeatureFlag>) => {
    setSaving(flag.key);
    const updated = { ...flag, ...patch };
    setFlags(prev => prev.map(f => f.key === flag.key ? updated : f));
    try {
      await fetch('/api/admin/feature-flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: flag.key, ...patch }),
      });
    } catch { /* ignore */ }
    setSaving(null);
  };

  const removeOverride = async (flagKey: string, userId: string) => {
    try {
      await fetch(`/api/admin/feature-flags/${flagKey}/overrides`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      setOverrides(prev => prev.filter(o => o.user_id !== userId));
      setFlags(prev => prev.map(f => f.key === flagKey ? { ...f, override_count: Math.max(0, (f.override_count || 1) - 1) } : f));
    } catch { /* ignore */ }
  };

  const saveNewFlag = async () => {
    if (!newFlag.key || !newFlag.name) return;
    try {
      const res = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlag),
      });
      if (res.ok) {
        const data = await res.json();
        setFlags(prev => [data.flag, ...prev]);
      } else {
        setFlags(prev => [{ id: Date.now().toString(), ...newFlag, override_count: 0, updated_at: new Date().toISOString() }, ...prev]);
      }
    } catch {
      setFlags(prev => [{ id: Date.now().toString(), ...newFlag, override_count: 0, updated_at: new Date().toISOString() }, ...prev]);
    }
    setShowAddModal(false);
    setNewFlag({ key: '', name: '', description: '', is_enabled_globally: false, enabled_for_plans: ['pro','enterprise'], rollout_percentage: 100 });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const globalOnCount  = flags.filter(f => f.is_enabled_globally).length;
  const globalOffCount = flags.filter(f => !f.is_enabled_globally).length;
  const totalOverrides = flags.reduce((s, f) => s + (f.override_count || 0), 0);

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0a0b14' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Feature Flags</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            Control feature availability per plan, user, or rollout percentage
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchFlags}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            <Plus size={14} /> Add Flag
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Flags',      value: flags.length,    color: '#a78bfa' },
          { label: 'Globally On',      value: globalOnCount,   color: '#34d399' },
          { label: 'Globally Off',     value: globalOffCount,  color: '#f87171' },
          { label: 'User Overrides',   value: totalOverrides,  color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Flags Table */}
      <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 160px 120px 100px 100px', gap: 0, padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Flag', 'Plans', 'Global Toggle', 'Rollout %', 'Overrides', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading flags...</div>
        ) : (
          flags.map((flag, i) => (
            <div key={flag.key}>
              {/* Row */}
              <div
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 160px 120px 100px 100px',
                  gap: 0, padding: '16px 20px',
                  borderBottom: i < flags.length - 1 || expandedKey === flag.key ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  alignItems: 'center',
                  background: expandedKey === flag.key ? 'rgba(139,92,246,0.05)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Name + Key */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{flag.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>{flag.key}</div>
                  {flag.description && (
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{flag.description}</div>
                  )}
                </div>

                {/* Plans */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {PLAN_OPTIONS.map(plan => {
                    const active = flag.enabled_for_plans.includes(plan);
                    const meta = PLAN_COLORS[plan];
                    return (
                      <span
                        key={plan}
                        style={{
                          fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 4,
                          background: active ? meta.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.06)'}`,
                          color: active ? meta.text : '#334155',
                        }}
                      >
                        {plan}
                      </span>
                    );
                  })}
                </div>

                {/* Global Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle
                    checked={flag.is_enabled_globally}
                    onChange={v => updateFlag(flag, { is_enabled_globally: v })}
                  />
                  <span style={{ fontSize: 12, color: flag.is_enabled_globally ? '#34d399' : '#64748b' }}>
                    {saving === flag.key ? '...' : flag.is_enabled_globally ? 'On' : 'Off'}
                  </span>
                </div>

                {/* Rollout % */}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
                    {flag.rollout_percentage}%
                  </div>
                  <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    <div style={{ width: `${flag.rollout_percentage}%`, height: '100%', background: '#8b5cf6', borderRadius: 2 }} />
                  </div>
                </div>

                {/* Override Count */}
                <div>
                  {(flag.override_count || 0) > 0 ? (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 12, fontWeight: 600, color: '#60a5fa',
                      background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
                      padding: '3px 8px', borderRadius: 12,
                    }}>
                      <Users size={11} /> {flag.override_count}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#334155' }}>—</span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => setEditingFlag(flag)}
                    style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => toggleExpand(flag.key)}
                    style={{ padding: '5px 10px', background: expandedKey === flag.key ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${expandedKey === flag.key ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: expandedKey === flag.key ? '#a78bfa' : '#94a3b8', cursor: 'pointer', fontSize: 12 }}
                  >
                    {expandedKey === flag.key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* Overrides Panel */}
              {expandedKey === flag.key && (
                <div style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '16px 24px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    User Overrides
                  </div>
                  {overridesLoading ? (
                    <div style={{ color: '#64748b', fontSize: 13 }}>Loading overrides...</div>
                  ) : overrides.length === 0 ? (
                    <div style={{ color: '#475569', fontSize: 13, fontStyle: 'italic' }}>No user overrides for this flag.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {overrides.map(ov => (
                        <div
                          key={ov.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 8, padding: '10px 14px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: ov.is_enabled ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {ov.is_enabled
                                ? <Check size={12} color="#34d399" />
                                : <X size={12} color="#f87171" />
                              }
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>
                                {ov.profiles?.full_name || ov.profiles?.email || ov.user_id}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {ov.profiles?.email} · {ov.reason || 'No reason'} · {formatDate(ov.created_at)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeOverride(flag.key, ov.user_id)}
                            style={{ padding: '4px 10px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 11 }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Flag Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 520, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Add Feature Flag</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Key (slug) *</label>
                  <input
                    value={newFlag.key}
                    onChange={e => setNewFlag(p => ({ ...p, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                    placeholder="my_feature"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Name *</label>
                  <input
                    value={newFlag.name}
                    onChange={e => setNewFlag(p => ({ ...p, name: e.target.value }))}
                    placeholder="My Feature"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Description</label>
                <input
                  value={newFlag.description}
                  onChange={e => setNewFlag(p => ({ ...p, description: e.target.value }))}
                  placeholder="What does this feature do?"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Enable for Plans</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PLAN_OPTIONS.map(plan => {
                    const active = newFlag.enabled_for_plans.includes(plan);
                    const meta = PLAN_COLORS[plan];
                    return (
                      <button
                        key={plan}
                        onClick={() => setNewFlag(p => ({
                          ...p,
                          enabled_for_plans: active
                            ? p.enabled_for_plans.filter(x => x !== plan)
                            : [...p.enabled_for_plans, plan],
                        }))}
                        style={{
                          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                          background: active ? meta.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.08)'}`,
                          color: active ? meta.text : '#475569',
                        }}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                  Rollout Percentage: <span style={{ color: '#a78bfa' }}>{newFlag.rollout_percentage}%</span>
                </label>
                <input
                  type="range" min={0} max={100}
                  value={newFlag.rollout_percentage}
                  onChange={e => setNewFlag(p => ({ ...p, rollout_percentage: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle checked={newFlag.is_enabled_globally} onChange={v => setNewFlag(p => ({ ...p, is_enabled_globally: v }))} />
                <span style={{ fontSize: 13, color: '#94a3b8' }}>Enable globally on creation</span>
              </div>

              {!newFlag.key && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8 }}>
                  <AlertCircle size={14} color="#eab308" />
                  <span style={{ fontSize: 12, color: '#eab308' }}>Key and name are required.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button
                onClick={saveNewFlag}
                disabled={!newFlag.key || !newFlag.name}
                style={{ padding: '9px 20px', background: newFlag.key && newFlag.name ? '#7c3aed' : 'rgba(124,58,237,0.3)', border: 'none', borderRadius: 8, color: newFlag.key && newFlag.name ? '#fff' : '#64748b', cursor: newFlag.key && newFlag.name ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 500 }}
              >
                Create Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Flag Modal */}
      {editingFlag && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 520, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Edit: {editingFlag.name}</h2>
              <button onClick={() => setEditingFlag(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Key</label>
                <input
                  value={editingFlag.key}
                  disabled
                  style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 12px', color: '#475569', fontSize: 13, fontFamily: 'monospace', boxSizing: 'border-box', cursor: 'not-allowed' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Name</label>
                <input
                  value={editingFlag.name}
                  onChange={e => setEditingFlag(p => p ? { ...p, name: e.target.value } : p)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Description</label>
                <input
                  value={editingFlag.description || ''}
                  onChange={e => setEditingFlag(p => p ? { ...p, description: e.target.value } : p)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>Enable for Plans</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {PLAN_OPTIONS.map(plan => {
                    const active = editingFlag.enabled_for_plans.includes(plan);
                    const meta = PLAN_COLORS[plan];
                    return (
                      <button
                        key={plan}
                        onClick={() => setEditingFlag(p => p ? {
                          ...p,
                          enabled_for_plans: active
                            ? p.enabled_for_plans.filter(x => x !== plan)
                            : [...p.enabled_for_plans, plan],
                        } : p)}
                        style={{
                          padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, textTransform: 'capitalize',
                          background: active ? meta.bg : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.08)'}`,
                          color: active ? meta.text : '#475569',
                        }}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 8 }}>
                  Rollout: <span style={{ color: '#a78bfa' }}>{editingFlag.rollout_percentage}%</span>
                </label>
                <input
                  type="range" min={0} max={100}
                  value={editingFlag.rollout_percentage}
                  onChange={e => setEditingFlag(p => p ? { ...p, rollout_percentage: Number(e.target.value) } : p)}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingFlag(null)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button
                onClick={() => { updateFlag(editingFlag, { name: editingFlag.name, description: editingFlag.description, enabled_for_plans: editingFlag.enabled_for_plans, rollout_percentage: editingFlag.rollout_percentage }); setEditingFlag(null); }}
                style={{ padding: '9px 20px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
