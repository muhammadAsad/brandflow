'use client';

import { useState } from 'react';
import { Check, X, ExternalLink, Loader } from 'lucide-react';

// ── Integration definitions ────────────────────────────────────────────────────

interface Integration {
  name: string;
  description: string;
  category: string;
  color: string;
  emoji: string;
  connected: boolean;
  available: boolean; // false = coming soon
  docsUrl?: string;
}

const INTEGRATIONS: Integration[] = [
  { name: 'Zapier',   description: 'Connect apps and automate workflows', category: 'Automation',   color: '#ff4a00', emoji: '⚡', connected: true,  available: true  },
  { name: 'Loom',     description: 'Record and share video messages',     category: 'Video',        color: '#625df5', emoji: '🎬', connected: true,  available: true  },
  { name: 'ClickUp',  description: 'Project management and tasks',        category: 'Productivity', color: '#7b68ee', emoji: '✅', connected: true,  available: true  },
  { name: 'Stripe',   description: 'Payment processing and billing',      category: 'Payments',     color: '#635bff', emoji: '💳', connected: true,  available: true  },
  { name: 'HubSpot',  description: 'CRM and marketing automation',        category: 'CRM',          color: '#ff7a59', emoji: '🧲', connected: false, available: false },
  { name: 'Notion',   description: 'Docs, wikis, and databases',          category: 'Productivity', color: '#000',    emoji: '📝', connected: false, available: false },
  { name: 'Slack',    description: 'Team messaging and notifications',    category: 'Messaging',    color: '#4a154b', emoji: '💬', connected: false, available: false },
  { name: 'Salesforce',description:'Enterprise CRM platform',            category: 'CRM',          color: '#00a1e0', emoji: '☁️', connected: false, available: false },
  { name: 'Mailchimp',description: 'Email marketing campaigns',           category: 'Email',        color: '#ffe01b', emoji: '🐵', connected: false, available: false },
];

// ── Toast ──────────────────────────────────────────────────────────────────────

interface Toast { id: number; type: 'success' | 'info' | 'error'; msg: string; }

// ── Page ───────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [connected,    setConnected]    = useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map(i => [i.name, i.connected]))
  );
  const [loading,      setLoading]      = useState<string | null>(null);
  const [toasts,       setToasts]       = useState<Toast[]>([]);
  const [confirmDisc,  setConfirmDisc]  = useState<string | null>(null);

  const addToast = (type: Toast['type'], msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleConnect = async (name: string, available: boolean) => {
    if (!available) {
      addToast('info', `${name} integration is coming soon! We'll notify you when it's ready.`);
      return;
    }
    setLoading(name);
    // Simulate OAuth / connection flow
    await new Promise(r => setTimeout(r, 1400));
    setConnected(p => ({ ...p, [name]: true }));
    setLoading(null);
    addToast('success', `${name} connected successfully!`);
  };

  const handleDisconnect = async (name: string) => {
    setConfirmDisc(null);
    setLoading(name);
    await new Promise(r => setTimeout(r, 800));
    setConnected(p => ({ ...p, [name]: false }));
    setLoading(null);
    addToast('info', `${name} has been disconnected.`);
  };

  const categories = [...new Set(INTEGRATIONS.map(i => i.category))];

  return (
    <div style={{ padding: '28px', fontFamily: "'DM Sans','Segoe UI',sans-serif", maxWidth: 960 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Integrations</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
          Connect your favourite tools to BrandFlow &mdash; {Object.values(connected).filter(Boolean).length} of {INTEGRATIONS.length} connected
        </p>
      </div>

      {/* Grouped by category */}
      {categories.map(cat => {
        const items = INTEGRATIONS.filter(i => i.category === cat);
        return (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              {cat}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              {items.map(intg => {
                const isConnected = connected[intg.name];
                const isLoading   = loading === intg.name;
                const isConfirming = confirmDisc === intg.name;
                return (
                  <div key={intg.name} style={{
                    background: '#fff', borderRadius: 14,
                    border: `1.5px solid ${isConnected ? '#bbf7d0' : '#ede9fe'}`,
                    padding: '18px 20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.15s',
                    position: 'relative',
                  }}>

                    {/* Coming soon badge */}
                    {!intg.available && (
                      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.04em' }}>
                        COMING SOON
                      </div>
                    )}

                    {/* Icon + status */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: intg.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {intg.emoji}
                      </div>
                      {isConnected && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 9px' }}>
                          <Check size={11} /> Connected
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{intg.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.4 }}>{intg.description}</div>

                    {/* Action button */}
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => handleDisconnect(intg.name)} style={{ flex: 1, height: 34, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                          Confirm
                        </button>
                        <button onClick={() => setConfirmDisc(null)} style={{ flex: 1, height: 34, borderRadius: 8, background: '#f8f7ff', border: '1px solid #ede9fe', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : isConnected ? (
                      <button
                        onClick={() => setConfirmDisc(intg.name)}
                        disabled={isLoading}
                        style={{ width: '100%', height: 34, borderRadius: 8, background: 'none', border: '1.5px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                      >
                        {isLoading ? <Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <X size={13} />}
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(intg.name, intg.available)}
                        disabled={isLoading}
                        style={{ width: '100%', height: 34, borderRadius: 8, background: intg.available ? `linear-gradient(135deg, ${intg.color}, ${intg.color}cc)` : '#f8f7ff', border: intg.available ? 'none' : '1.5px solid #ede9fe', color: intg.available ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, cursor: isLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                      >
                        {isLoading
                          ? <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Connecting…</>
                          : <><ExternalLink size={13} /> {intg.available ? 'Connect' : 'Notify Me'}</>
                        }
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'success' ? '#f0fdf4' : t.type === 'error' ? '#fef2f2' : '#f8f7ff',
            border: `1px solid ${t.type === 'success' ? '#bbf7d0' : t.type === 'error' ? '#fecaca' : '#ede9fe'}`,
            color: t.type === 'success' ? '#15803d' : t.type === 'error' ? '#dc2626' : '#7c3aed',
            padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            animation: 'slideIn 0.25s ease',
            maxWidth: 340,
          }}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
