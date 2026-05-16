'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, AlertTriangle, Users, DollarSign, Mail, Shield, Plus, X, Check } from 'lucide-react';

interface SystemSettings {
  maintenance_mode: boolean;
  allow_registrations: boolean;
  require_email_verification: boolean;
  max_free_posts: number;
  max_pro_posts: number;
  max_enterprise_posts: number;
  max_free_contacts: number;
  max_pro_contacts: number;
  max_enterprise_contacts: number;
  free_plan_price: number;
  pro_plan_price: number;
  enterprise_plan_price: number;
  smtp_from_name: string;
  smtp_from_email: string;
  admin_emails: string[];
}

const DEFAULTS: SystemSettings = {
  maintenance_mode: false,
  allow_registrations: true,
  require_email_verification: true,
  max_free_posts: 10,
  max_pro_posts: 500,
  max_enterprise_posts: -1,
  max_free_contacts: 100,
  max_pro_contacts: 5000,
  max_enterprise_contacts: -1,
  free_plan_price: 0,
  pro_plan_price: 29,
  enterprise_plan_price: 99,
  smtp_from_name: 'BrandFlow',
  smtp_from_email: 'noreply@brandflow.io',
  admin_emails: ['muhammadubs@gmail.com'],
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 12px', color: '#f1f5f9', fontSize: 13, outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6,
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        position: 'relative', display: 'inline-flex', width: 44, height: 24,
        borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? '#8b5cf6' : 'rgba(255,255,255,0.12)',
        transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
    </button>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        {icon}
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipeText, setWipeText] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings({ ...DEFAULTS, ...data.settings });
      }
    } catch { /* use defaults */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveAll = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const set = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings(p => ({ ...p, [key]: value }));
  };

  const addAdmin = () => {
    if (!newAdminEmail || settings.admin_emails.includes(newAdminEmail)) return;
    set('admin_emails', [...settings.admin_emails, newAdminEmail]);
    setNewAdminEmail('');
  };

  const removeAdmin = (email: string) => {
    set('admin_emails', settings.admin_emails.filter(e => e !== email));
  };

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#0a0b14' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Settings</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Global system configuration</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchSettings} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
            <RefreshCw size={14} />
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: saved ? '#15803d' : '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: saving ? 'wait' : 'pointer', fontSize: 14, fontWeight: 500, transition: 'background 0.3s' }}
          >
            {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 60 }}>Loading settings...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Registration */}
          <Section icon={<Users size={16} color="#a78bfa" />} title="Registration & Access">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>Allow New Registrations</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>When disabled, new sign-ups will be blocked</div>
                </div>
                <Toggle checked={settings.allow_registrations} onChange={v => set('allow_registrations', v)} />
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0' }}>Require Email Verification</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Users must verify their email before accessing the app</div>
                </div>
                <Toggle checked={settings.require_email_verification} onChange={v => set('require_email_verification', v)} />
              </div>
            </div>
          </Section>

          {/* Plan Limits */}
          <Section icon={<Shield size={16} color="#60a5fa" />} title="Plan Limits">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {(['free', 'pro', 'enterprise'] as const).map(plan => (
                <div key={plan} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: plan === 'free' ? '#9ca3af' : plan === 'pro' ? '#a78bfa' : '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>{plan}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Max Posts <span style={{ color: '#475569', fontWeight: 400 }}>(−1 = unlimited)</span></label>
                      <input
                        type="number"
                        value={settings[`max_${plan}_posts` as keyof SystemSettings] as number}
                        onChange={e => set(`max_${plan}_posts` as keyof SystemSettings, Number(e.target.value) as never)}
                        style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Max Contacts <span style={{ color: '#475569', fontWeight: 400 }}>(−1 = unlimited)</span></label>
                      <input
                        type="number"
                        value={settings[`max_${plan}_contacts` as keyof SystemSettings] as number}
                        onChange={e => set(`max_${plan}_contacts` as keyof SystemSettings, Number(e.target.value) as never)}
                        style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={<DollarSign size={16} color="#34d399" />} title="Plan Pricing (USD/month)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {([
                { plan: 'free',       label: 'Free',       key: 'free_plan_price' as keyof SystemSettings },
                { plan: 'pro',        label: 'Pro',        key: 'pro_plan_price' as keyof SystemSettings },
                { plan: 'enterprise', label: 'Enterprise', key: 'enterprise_plan_price' as keyof SystemSettings },
              ]).map(({ label, key }) => (
                <div key={key}>
                  <label style={labelStyle}>{label} Plan Price</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 13, pointerEvents: 'none' }}>$</span>
                    <input
                      type="number" min={0}
                      value={settings[key] as number}
                      onChange={e => set(key, Number(e.target.value) as never)}
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 24 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Email */}
          <Section icon={<Mail size={16} color="#f59e0b" />} title="Email Settings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>From Name</label>
                <input
                  value={settings.smtp_from_name}
                  onChange={e => set('smtp_from_name', e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={labelStyle}>From Email</label>
                <input
                  type="email"
                  value={settings.smtp_from_email}
                  onChange={e => set('smtp_from_email', e.target.value)}
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </Section>

          {/* Admin Team */}
          <Section icon={<Shield size={16} color="#a78bfa" />} title="Admin Team">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {settings.admin_emails.map(email => (
                <div key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#a78bfa' }}>
                      {email[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, color: '#e2e8f0' }}>{email}</span>
                  </div>
                  <button
                    onClick={() => removeAdmin(email)}
                    disabled={settings.admin_emails.length <= 1}
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: settings.admin_emails.length <= 1 ? 'not-allowed' : 'pointer', opacity: settings.admin_emails.length <= 1 ? 0.3 : 1, padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addAdmin()}
                  placeholder="Add admin email..."
                  type="email"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={addAdmin}
                  disabled={!newAdminEmail}
                  style={{ padding: '9px 16px', background: newAdminEmail ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${newAdminEmail ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, color: newAdminEmail ? '#a78bfa' : '#334155', cursor: newAdminEmail ? 'pointer' : 'not-allowed', fontSize: 13 }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </Section>

          {/* Danger Zone */}
          <div style={{ background: '#12131e', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.04)' }}>
              <AlertTriangle size={16} color="#f87171" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f87171', margin: 0 }}>Danger Zone</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Maintenance Mode */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.15)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#eab308' }}>Maintenance Mode</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Non-admin users will see a maintenance page. Admins can still access the app.</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {settings.maintenance_mode && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#eab308', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', padding: '3px 8px', borderRadius: 10 }}>ACTIVE</span>
                  )}
                  {!confirmMaintenance ? (
                    <button
                      onClick={() => setConfirmMaintenance(true)}
                      style={{ padding: '7px 16px', background: settings.maintenance_mode ? 'rgba(52,211,153,0.1)' : 'rgba(234,179,8,0.1)', border: `1px solid ${settings.maintenance_mode ? 'rgba(52,211,153,0.25)' : 'rgba(234,179,8,0.25)'}`, borderRadius: 8, color: settings.maintenance_mode ? '#34d399' : '#eab308', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      {settings.maintenance_mode ? 'Disable' : 'Enable'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { set('maintenance_mode', !settings.maintenance_mode); setConfirmMaintenance(false); }} style={{ padding: '7px 14px', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 8, color: '#eab308', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Confirm</button>
                      <button onClick={() => setConfirmMaintenance(false)} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Wipe */}
              <div style={{ padding: '14px 16px', background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f87171', marginBottom: 4 }}>Wipe Demo Data</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Permanently delete all posts, campaigns, and contacts created before the current date. This cannot be undone.</div>
                {!confirmWipe ? (
                  <button
                    onClick={() => setConfirmWipe(true)}
                    style={{ padding: '7px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                  >
                    Wipe Demo Data
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, color: '#f87171' }}>Type <strong>WIPE DATA</strong> to confirm:</div>
                    <input
                      value={wipeText}
                      onChange={e => setWipeText(e.target.value)}
                      placeholder="WIPE DATA"
                      style={{ ...inputStyle, border: '1px solid rgba(248,113,113,0.3)' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { if (wipeText === 'WIPE DATA') { setConfirmWipe(false); setWipeText(''); } }}
                        disabled={wipeText !== 'WIPE DATA'}
                        style={{ padding: '7px 16px', background: wipeText === 'WIPE DATA' ? 'rgba(248,113,113,0.2)' : 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: wipeText === 'WIPE DATA' ? '#f87171' : '#475569', cursor: wipeText === 'WIPE DATA' ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600 }}
                      >
                        Wipe Data
                      </button>
                      <button onClick={() => { setConfirmWipe(false); setWipeText(''); }} style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
