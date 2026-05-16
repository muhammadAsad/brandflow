'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Megaphone, X, RefreshCw, AlertCircle, Eye } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  show_from: string | null;
  show_until: string | null;
  target_plans: string[];
  dismissable: boolean;
  created_at: string;
  created_by: string | null;
}

const TYPE_META = {
  info:    { label: 'Info',    color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)',   icon: 'ℹ' },
  success: { label: 'Success', color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.25)',   icon: '✓' },
  warning: { label: 'Warning', color: '#eab308', bg: 'rgba(234,179,8,0.1)',    border: 'rgba(234,179,8,0.25)',    icon: '⚠' },
  error:   { label: 'Alert',   color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)',  icon: '!' },
};

const DEMO: Announcement[] = [
  { id: 'a1', title: 'New Feature: Automation Workflows', message: 'Build powerful marketing automations with our new visual workflow builder. Available on Pro and Enterprise plans.', type: 'info',    is_active: true,  show_from: null, show_until: null,                   target_plans: [], dismissable: true,  created_at: new Date(Date.now()-86400000).toISOString(),   created_by: 'admin' },
  { id: 'a2', title: 'Scheduled Maintenance',             message: 'We will be performing scheduled maintenance on Saturday May 18 from 2AM–4AM UTC. Brief downtime expected.', type: 'warning', is_active: true,  show_from: null, show_until: '2026-05-18T04:00:00Z', target_plans: [], dismissable: false, created_at: new Date(Date.now()-3600000).toISOString(),    created_by: 'admin' },
  { id: 'a3', title: 'Pro Plan Upgrade Offer',            message: 'Limited time: Upgrade to Pro and get 30% off your first 3 months. Use code UPGRADE30 at checkout.', type: 'success', is_active: false, show_from: null, show_until: '2026-05-31T00:00:00Z', target_plans: ['free'], dismissable: true, created_at: new Date(Date.now()-172800000).toISOString(), created_by: 'admin' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, boxSizing: 'border-box', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6,
};

function BannerPreview({ ann }: { ann: Partial<Announcement> }) {
  const type = ann.type || 'info';
  const meta = TYPE_META[type];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 8,
      background: meta.bg, border: `1px solid ${meta.border}`,
    }}>
      <span style={{ fontSize: 14, color: meta.color, fontWeight: 700, flexShrink: 0 }}>{meta.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {ann.title && <div style={{ fontSize: 13, fontWeight: 600, color: meta.color, marginBottom: 1 }}>{ann.title}</div>}
        <div style={{ fontSize: 12, color: '#e2e8f0' }}>{ann.message || 'Your message will appear here...'}</div>
      </div>
      {ann.dismissable && (
        <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={10} color="#94a3b8" />
        </div>
      )}
    </div>
  );
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info' as Announcement['type'],
    is_active: true,
    show_from: '',
    show_until: '',
    target_plans: [] as string[],
    dismissable: true,
  });

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements?.length ? data.announcements : DEMO);
      } else {
        setAnnouncements(DEMO);
      }
    } catch {
      setAnnouncements(DEMO);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const toggleActive = async (ann: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_active: !a.is_active } : a));
    try {
      await fetch('/api/admin/announcements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ann.id, is_active: !ann.is_active }),
      });
    } catch { /* ignore */ }
  };

  const deleteAnn = async (ann: Announcement) => {
    setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
    try {
      await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ann.id }),
      });
    } catch { /* ignore */ }
  };

  const submitCreate = async () => {
    const body = {
      ...form,
      show_from: form.show_from || null,
      show_until: form.show_until || null,
    };
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(prev => [data.announcement, ...prev]);
      } else {
        setAnnouncements(prev => [{ id: Date.now().toString(), created_at: new Date().toISOString(), created_by: 'admin', ...body } as Announcement, ...prev]);
      }
    } catch {
      setAnnouncements(prev => [{ id: Date.now().toString(), created_at: new Date().toISOString(), created_by: 'admin', ...body } as Announcement, ...prev]);
    }
    setShowModal(false);
    setForm({ title: '', message: '', type: 'info', is_active: true, show_from: '', show_until: '', target_plans: [], dismissable: true });
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const togglePlan = (plan: string) => {
    setForm(p => ({
      ...p,
      target_plans: p.target_plans.includes(plan)
        ? p.target_plans.filter(x => x !== plan)
        : [...p.target_plans, plan],
    }));
  };

  const activeCount = announcements.filter(a => a.is_active).length;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0a0b14' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Announcements</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Banner messages shown to users in the dashboard</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAnnouncements} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
            <Plus size={14} /> New Announcement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total',  value: announcements.length, color: '#a78bfa' },
          { label: 'Active', value: activeCount,           color: '#34d399' },
          { label: 'Inactive', value: announcements.length - activeCount, color: '#64748b' },
        ].map(s => (
          <div key={s.label} style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {announcements.map(ann => {
            const meta = TYPE_META[ann.type];
            const isExpired = ann.show_until ? new Date(ann.show_until) < new Date() : false;
            return (
              <div
                key={ann.id}
                style={{
                  background: '#12131e', border: `1px solid ${ann.is_active && !isExpired ? meta.border : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12, overflow: 'hidden',
                  opacity: isExpired ? 0.6 : 1,
                }}
              >
                {/* Top bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Megaphone size={13} color={meta.color} />
                    </div>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{ann.title}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color, textTransform: 'uppercase' }}>{meta.label}</span>
                        {ann.is_active && !isExpired && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', textTransform: 'uppercase' }}>Live</span>}
                        {isExpired && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', color: '#eab308', textTransform: 'uppercase' }}>Expired</span>}
                        {!ann.dismissable && <span style={{ fontSize: 10, color: '#64748b' }}>Non-dismissable</span>}
                        {ann.target_plans.length > 0 && <span style={{ fontSize: 10, color: '#64748b' }}>→ {ann.target_plans.join(', ')}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#475569' }}>
                      {formatDate(ann.show_from)} – {formatDate(ann.show_until)}
                    </span>
                    <button
                      onClick={() => setPreviewId(previewId === ann.id ? null : ann.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: previewId === ann.id ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${previewId === ann.id ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, color: previewId === ann.id ? '#a78bfa' : '#64748b', cursor: 'pointer', fontSize: 11 }}
                    >
                      <Eye size={11} /> Preview
                    </button>
                    <button
                      onClick={() => toggleActive(ann)}
                      disabled={isExpired}
                      style={{ padding: '5px 12px', background: ann.is_active ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${ann.is_active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, borderRadius: 6, color: ann.is_active ? '#f87171' : '#34d399', cursor: isExpired ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, opacity: isExpired ? 0.4 : 1 }}
                    >
                      {ann.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAnn(ann)}
                      style={{ padding: '5px 8px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 6, color: '#f87171', cursor: 'pointer', fontSize: 11 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Message preview */}
                <div style={{ padding: '12px 18px' }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{ann.message}</p>
                </div>

                {/* Dashboard preview */}
                {previewId === ann.id && (
                  <div style={{ padding: '0 18px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Dashboard Preview</div>
                    <BannerPreview ann={ann} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, width: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>New Announcement</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Write your message here..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(Object.keys(TYPE_META) as Announcement['type'][]).map(type => {
                    const meta = TYPE_META[type];
                    const active = form.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setForm(p => ({ ...p, type }))}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${active ? meta.border : 'rgba(255,255,255,0.08)'}`, background: active ? meta.bg : 'rgba(255,255,255,0.04)', color: active ? meta.color : '#475569' }}
                      >
                        {meta.icon} {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Show From (optional)</label>
                  <input type="date" value={form.show_from} onChange={e => setForm(p => ({ ...p, show_from: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Show Until (optional)</label>
                  <input type="date" value={form.show_until} onChange={e => setForm(p => ({ ...p, show_until: e.target.value }))} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Target Plans (blank = all users)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['free', 'pro', 'enterprise'].map(plan => {
                    const active = form.target_plans.includes(plan);
                    return (
                      <button
                        key={plan}
                        onClick={() => togglePlan(plan)}
                        style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, textTransform: 'capitalize', border: `1px solid ${active ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)', color: active ? '#a78bfa' : '#475569' }}
                      >
                        {plan}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox" id="dismissable"
                  checked={form.dismissable}
                  onChange={e => setForm(p => ({ ...p, dismissable: e.target.checked }))}
                  style={{ accentColor: '#8b5cf6', width: 14, height: 14 }}
                />
                <label htmlFor="dismissable" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                  Allow users to dismiss this banner
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox" id="isActive"
                  checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  style={{ accentColor: '#8b5cf6', width: 14, height: 14 }}
                />
                <label htmlFor="isActive" style={{ fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
                  Activate immediately
                </label>
              </div>

              {/* Live Preview */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Live Preview</div>
                <BannerPreview ann={form} />
              </div>

              {(!form.title || !form.message) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8 }}>
                  <AlertCircle size={14} color="#eab308" />
                  <span style={{ fontSize: 12, color: '#eab308' }}>Title and message are required.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '9px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button
                onClick={submitCreate}
                disabled={!form.title || !form.message}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', background: form.title && form.message ? '#7c3aed' : 'rgba(124,58,237,0.3)', border: 'none', borderRadius: 8, color: form.title && form.message ? '#fff' : '#64748b', cursor: form.title && form.message ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 500 }}
              >
                <Megaphone size={14} /> Publish Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
