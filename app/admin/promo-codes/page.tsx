'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Plus, X, Tag, Check, ChevronRight, Eye, Zap, AlertCircle, Copy } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  applies_to_plan: string | null;
  stripe_coupon_id: string | null;
  created_at: string;
}

interface CodeUse {
  id: string;
  user_id: string;
  used_at: string;
  profiles?: { email: string; full_name: string | null };
}

const DEMO_CODES: PromoCode[] = [
  { id: 'p1', code: 'LAUNCH50',     description: 'Launch week 50% off',       discount_type: 'percentage', discount_value: 50,  max_uses: 200,  uses_count: 143, expires_at: '2026-06-01T00:00:00Z', is_active: true,  applies_to_plan: 'pro',        stripe_coupon_id: 'cpn_1abc', created_at: new Date(Date.now()-2592000000).toISOString() },
  { id: 'p2', code: 'FRIEND20',     description: 'Referral discount',          discount_type: 'percentage', discount_value: 20,  max_uses: null, uses_count: 87,  expires_at: null,                   is_active: true,  applies_to_plan: null,         stripe_coupon_id: 'cpn_2abc', created_at: new Date(Date.now()-5184000000).toISOString() },
  { id: 'p3', code: 'SAVE10',       description: '$10 flat off any plan',      discount_type: 'fixed',      discount_value: 10,  max_uses: 500,  uses_count: 501, expires_at: '2026-05-01T00:00:00Z', is_active: false, applies_to_plan: null,         stripe_coupon_id: null,       created_at: new Date(Date.now()-7776000000).toISOString() },
  { id: 'p4', code: 'ENTERPRISE25', description: 'Enterprise trial discount',  discount_type: 'percentage', discount_value: 25,  max_uses: 50,   uses_count: 12,  expires_at: '2026-12-31T00:00:00Z', is_active: true,  applies_to_plan: 'enterprise', stripe_coupon_id: 'cpn_3abc', created_at: new Date(Date.now()-864000000).toISOString() },
  { id: 'p5', code: 'BETA100',      description: 'Free beta access',           discount_type: 'percentage', discount_value: 100, max_uses: 25,   uses_count: 25,  expires_at: null,                   is_active: false, applies_to_plan: 'pro',        stripe_coupon_id: null,       created_at: new Date(Date.now()-10368000000).toISOString() },
];

const DEMO_USES: CodeUse[] = [
  { id: 'u1', user_id: 'uid1', used_at: new Date(Date.now()-3600000).toISOString(),   profiles: { email: 'alice@example.com', full_name: 'Alice Johnson' } },
  { id: 'u2', user_id: 'uid2', used_at: new Date(Date.now()-86400000).toISOString(),  profiles: { email: 'bob@example.com',   full_name: 'Bob Smith' } },
  { id: 'u3', user_id: 'uid3', used_at: new Date(Date.now()-172800000).toISOString(), profiles: { email: 'carol@example.com', full_name: 'Carol Davis' } },
];

const STEPS = ['Details', 'Discount', 'Restrictions'];

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6,
};

function StatusBadge({ active, expired, maxed }: { active: boolean; expired: boolean; maxed: boolean }) {
  if (maxed)   return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontWeight: 600 }}>MAXED</span>;
  if (expired) return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(234,179,8,0.12)',   border: '1px solid rgba(234,179,8,0.25)',   color: '#eab308', fontWeight: 600 }}>EXPIRED</span>;
  if (active)  return <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',  color: '#34d399', fontWeight: 600 }}>ACTIVE</span>;
  return              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: 'rgba(100,116,139,0.12)', border: '1px solid rgba(100,116,139,0.25)', color: '#64748b', fontWeight: 600 }}>INACTIVE</span>;
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [viewingCode, setViewingCode] = useState<PromoCode | null>(null);
  const [uses, setUses] = useState<CodeUse[]>([]);
  const [usesLoading, setUsesLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState('');

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 20,
    max_uses: '',
    expires_at: '',
    applies_to_plan: '',
    create_in_stripe: false,
  });

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes?.length ? data.codes : DEMO_CODES);
      } else {
        setCodes(DEMO_CODES);
      }
    } catch {
      setCodes(DEMO_CODES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const openUses = async (code: PromoCode) => {
    setViewingCode(code);
    setUsesLoading(true);
    try {
      const res = await fetch(`/api/admin/promo-codes/${code.id}/uses`);
      if (res.ok) {
        const data = await res.json();
        setUses(data.uses?.length ? data.uses : DEMO_USES);
      } else {
        setUses(DEMO_USES);
      }
    } catch {
      setUses(DEMO_USES);
    } finally {
      setUsesLoading(false);
    }
  };

  const toggleActive = async (code: PromoCode) => {
    setCodes(prev => prev.map(c => c.id === code.id ? { ...c, is_active: !c.is_active } : c));
    try {
      await fetch('/api/admin/promo-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: code.id, is_active: !code.is_active }),
      });
    } catch { /* ignore */ }
  };

  const syncToStripe = async () => {
    setSyncing(true);
    try {
      await fetch('/api/admin/promo-codes/stripe-sync', { method: 'POST' });
      await fetchCodes();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(p => ({ ...p, code }));
  };

  const submitCreate = async () => {
    const body = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      applies_to_plan: form.applies_to_plan || null,
      create_in_stripe: form.create_in_stripe,
    };
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(prev => [data.code, ...prev]);
      } else {
        setCodes(prev => [{ id: Date.now().toString(), uses_count: 0, is_active: true, stripe_coupon_id: null, created_at: new Date().toISOString(), ...body } as PromoCode, ...prev]);
      }
    } catch {
      setCodes(prev => [{ id: Date.now().toString(), uses_count: 0, is_active: true, stripe_coupon_id: null, created_at: new Date().toISOString(), ...body } as PromoCode, ...prev]);
    }
    setShowCreateModal(false);
    setStep(0);
    setForm({ code: '', description: '', discount_type: 'percentage', discount_value: 20, max_uses: '', expires_at: '', applies_to_plan: '', create_in_stripe: false });
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (code: PromoCode) => code.expires_at ? new Date(code.expires_at) < new Date() : false;
  const isMaxed   = (code: PromoCode) => code.max_uses !== null && code.uses_count >= code.max_uses;

  const totalActive = codes.filter(c => c.is_active && !isExpired(c) && !isMaxed(c)).length;
  const totalUses   = codes.reduce((s, c) => s + c.uses_count, 0);
  const stripeSync  = codes.filter(c => c.stripe_coupon_id).length;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0a0b14' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Promo Codes</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Create and manage discount codes</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={syncToStripe}
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: syncing ? 'wait' : 'pointer', fontSize: 14 }}
          >
            <Zap size={14} color="#a78bfa" /> {syncing ? 'Syncing...' : 'Sync Stripe'}
          </button>
          <button
            onClick={fetchCodes}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => { setShowCreateModal(true); setStep(0); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
          >
            <Plus size={14} /> Create Code
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Codes',   value: codes.length,   color: '#a78bfa' },
          { label: 'Active',        value: totalActive,    color: '#34d399' },
          { label: 'Total Uses',    value: totalUses,      color: '#60a5fa' },
          { label: 'Stripe Synced', value: stripeSync,     color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['Code', 'Discount', 'Uses', 'Expires', 'Plan', 'Status', 'Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading codes...</div>
        ) : (
          codes.map((code, i) => (
            <div
              key={code.id}
              style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr',
                padding: '14px 20px', borderBottom: i < codes.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center',
              }}
            >
              {/* Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '4px 10px' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{code.code}</span>
                </div>
                <button
                  onClick={() => copyCode(code.code)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === code.code ? '#34d399' : '#475569', padding: 2 }}
                  title="Copy code"
                >
                  {copied === code.code ? <Check size={13} /> : <Copy size={13} />}
                </button>
                {code.stripe_coupon_id && (
                  <span title="Synced to Stripe" style={{ fontSize: 10, padding: '2px 5px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 4, color: '#f59e0b' }}>S</span>
                )}
              </div>

              {/* Discount */}
              <div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>
                  {code.discount_type === 'percentage' ? `${code.discount_value}%` : `$${code.discount_value}`}
                </span>
                <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>off</span>
              </div>

              {/* Uses */}
              <div style={{ fontSize: 13, color: '#e2e8f0' }}>
                {code.uses_count}
                {code.max_uses && <span style={{ color: '#64748b' }}> / {code.max_uses}</span>}
                {code.max_uses && (
                  <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ width: `${Math.min(100, (code.uses_count / code.max_uses) * 100)}%`, height: '100%', background: isMaxed(code) ? '#f87171' : '#8b5cf6', borderRadius: 2 }} />
                  </div>
                )}
              </div>

              {/* Expires */}
              <div style={{ fontSize: 12, color: isExpired(code) ? '#f87171' : '#94a3b8' }}>
                {formatDate(code.expires_at)}
              </div>

              {/* Plan */}
              <div>
                {code.applies_to_plan ? (
                  <span style={{ fontSize: 11, textTransform: 'capitalize', padding: '3px 8px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontWeight: 600 }}>
                    {code.applies_to_plan}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#475569' }}>All</span>
                )}
              </div>

              {/* Status */}
              <StatusBadge active={code.is_active} expired={isExpired(code)} maxed={isMaxed(code)} />

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => openUses(code)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 6, color: '#60a5fa', cursor: 'pointer', fontSize: 11 }}
                >
                  <Eye size={11} /> Uses
                </button>
                <button
                  onClick={() => toggleActive(code)}
                  disabled={isExpired(code) || isMaxed(code)}
                  style={{
                    padding: '5px 10px',
                    background: code.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)',
                    border: `1px solid ${code.is_active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                    borderRadius: 6, color: code.is_active ? '#f87171' : '#34d399',
                    cursor: isExpired(code) || isMaxed(code) ? 'not-allowed' : 'pointer',
                    fontSize: 11, opacity: isExpired(code) || isMaxed(code) ? 0.4 : 1,
                  }}
                >
                  {code.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Uses Modal */}
      {viewingCode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Uses: {viewingCode.code}</h2>
                <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>{viewingCode.uses_count} total redemptions</p>
              </div>
              <button onClick={() => setViewingCode(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '16px 24px', flex: 1 }}>
              {usesLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>Loading...</div>
              ) : uses.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#475569', padding: 32, fontStyle: 'italic' }}>No uses recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {uses.map(use => (
                    <div key={use.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{use.profiles?.full_name || use.profiles?.email || use.user_id}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{use.profiles?.email}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(use.used_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal (3-step) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 540, padding: 28, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            {/* Step Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {STEPS.map((s, idx) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: idx < step ? '#7c3aed' : idx === step ? '#8b5cf6' : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${idx <= step ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: idx <= step ? '#fff' : '#475569',
                    }}>
                      {idx < step ? <Check size={13} /> : idx + 1}
                    </div>
                    <span style={{ fontSize: 12, color: idx === step ? '#e2e8f0' : '#475569', marginLeft: 6 }}>{s}</span>
                    {idx < STEPS.length - 1 && <ChevronRight size={14} color="#334155" style={{ margin: '0 8px' }} />}
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowCreateModal(false); setStep(0); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Step 0: Details */}
            {step === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Code Details</h3>
                <div>
                  <label style={labelStyle}>Code *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={form.code}
                      onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                      placeholder="PROMO2026"
                      style={{ ...inputStyle, flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }}
                    />
                    <button
                      onClick={generateCode}
                      style={{ padding: '9px 14px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, color: '#a78bfa', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this promo" style={inputStyle} />
                </div>
              </div>
            )}

            {/* Step 1: Discount */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Discount Settings</h3>
                <div>
                  <label style={labelStyle}>Discount Type</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {(['percentage', 'fixed'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(p => ({ ...p, discount_type: type }))}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500, border: `1px solid ${form.discount_type === type ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.1)'}`, background: form.discount_type === type ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)', color: form.discount_type === type ? '#a78bfa' : '#64748b' }}
                      >
                        {type === 'percentage' ? '% Percentage' : '$ Fixed Amount'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>{form.discount_type === 'percentage' ? 'Percentage (0–100)' : 'Amount in USD'}</label>
                  <div style={{ position: 'relative' }}>
                    {form.discount_type === 'fixed' && (
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>$</span>
                    )}
                    <input
                      type="number"
                      min={0} max={form.discount_type === 'percentage' ? 100 : undefined}
                      value={form.discount_value}
                      onChange={e => setForm(p => ({ ...p, discount_value: Number(e.target.value) }))}
                      style={{ ...inputStyle, paddingLeft: form.discount_type === 'fixed' ? 24 : 12 }}
                    />
                    {form.discount_type === 'percentage' && (
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>%</span>
                    )}
                  </div>
                </div>
                {form.discount_value > 0 && (
                  <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: '#34d399' }}>
                      Preview: {form.discount_type === 'percentage' ? `${form.discount_value}% off` : `$${form.discount_value} off`} the subscription
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Restrictions */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Restrictions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Max Uses (blank = unlimited)</label>
                    <input type="number" min={1} value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Unlimited" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expiry Date (optional)</label>
                    <input type="date" value={form.expires_at} onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Applies to Plan (blank = all plans)</label>
                  <select value={form.applies_to_plan} onChange={e => setForm(p => ({ ...p, applies_to_plan: e.target.value }))} style={{ ...inputStyle }}>
                    <option value="">All plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                  <input
                    type="checkbox"
                    id="stripeSync"
                    checked={form.create_in_stripe}
                    onChange={e => setForm(p => ({ ...p, create_in_stripe: e.target.checked }))}
                    style={{ accentColor: '#f59e0b', width: 14, height: 14 }}
                  />
                  <label htmlFor="stripeSync" style={{ fontSize: 13, color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} /> Also create as a Stripe coupon
                  </label>
                </div>
                {/* Summary */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      ['Code',     form.code || '—'],
                      ['Discount', form.discount_type === 'percentage' ? `${form.discount_value}%` : `$${form.discount_value}`],
                      ['Max Uses', form.max_uses || 'Unlimited'],
                      ['Expires',  form.expires_at ? new Date(form.expires_at).toLocaleDateString() : 'Never'],
                      ['Plan',     form.applies_to_plan || 'All plans'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#64748b' }}>{k}</span>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!form.code && step === 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, marginTop: 12 }}>
                <AlertCircle size={14} color="#eab308" />
                <span style={{ fontSize: 12, color: '#eab308' }}>Code is required.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'space-between' }}>
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : setShowCreateModal(false)}
                style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
              >
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 && !form.code}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: step === 0 && !form.code ? 'rgba(124,58,237,0.3)' : '#7c3aed', border: 'none', borderRadius: 8, color: step === 0 && !form.code ? '#64748b' : '#fff', cursor: step === 0 && !form.code ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={submitCreate}
                  disabled={!form.code}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: form.code ? '#7c3aed' : 'rgba(124,58,237,0.3)', border: 'none', borderRadius: 8, color: form.code ? '#fff' : '#64748b', cursor: form.code ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 500 }}
                >
                  <Tag size={14} /> Create Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
