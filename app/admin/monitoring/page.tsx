'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, CheckCircle, AlertTriangle, XCircle, Cpu, Database, Zap, Globe, Clock } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HealthStatus = 'healthy' | 'degraded' | 'down';

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency: number;        // ms
  uptime: number;         // %
  lastChecked: string;    // ISO
  detail?: string;
}

interface ErrorPoint { time: string; count: number }

// ── Demo data ─────────────────────────────────────────────────────────────────

function buildDemo(): { services: ServiceHealth[]; errorRate: ErrorPoint[]; requestsPerMin: number; p99: number; p50: number } {
  const now = Date.now();
  const errorRate: ErrorPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now - i * 3600000);
    errorRate.push({
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      count: Math.floor(Math.random() * 5),
    });
  }
  return {
    services: [
      { name: 'API Gateway',      status: 'healthy',  latency: 42,   uptime: 99.98, lastChecked: new Date(now - 12000).toISOString(), detail: 'All endpoints responding normally' },
      { name: 'Supabase DB',      status: 'healthy',  latency: 18,   uptime: 99.99, lastChecked: new Date(now - 8000).toISOString(),  detail: 'Connection pool nominal' },
      { name: 'Auth Service',     status: 'healthy',  latency: 31,   uptime: 99.95, lastChecked: new Date(now - 15000).toISOString(), detail: 'JWT validation working' },
      { name: 'Stripe Webhooks',  status: 'healthy',  latency: 187,  uptime: 99.9,  lastChecked: new Date(now - 20000).toISOString(), detail: '0 failed webhook deliveries' },
      { name: 'AI Generation',    status: 'degraded', latency: 1820, uptime: 97.4,  lastChecked: new Date(now - 30000).toISOString(), detail: 'Higher than normal latency on Claude API' },
      { name: 'Image CDN',        status: 'healthy',  latency: 24,   uptime: 100,   lastChecked: new Date(now - 5000).toISOString(),  detail: 'Cache hit rate 94%' },
      { name: 'Email (Resend)',    status: 'healthy',  latency: 95,   uptime: 99.7,  lastChecked: new Date(now - 25000).toISOString(), detail: 'Delivery rate 98.3%' },
      { name: 'Scheduler / Cron', status: 'healthy',  latency: 11,   uptime: 99.99, lastChecked: new Date(now - 60000).toISOString(), detail: 'All jobs running on schedule' },
    ],
    errorRate,
    requestsPerMin: 247,
    p50: 38,
    p99: 312,
  };
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_META: Record<HealthStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  healthy:  { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: <CheckCircle  size={14} color="#22c55e" />, label: 'Healthy' },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: <AlertTriangle size={14} color="#f59e0b" />, label: 'Degraded' },
  down:     { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: <XCircle      size={14} color="#ef4444" />, label: 'Down' },
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

// ── Error rate chart ──────────────────────────────────────────────────────────

function ErrorChart({ data }: { data: ErrorPoint[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const visible = data.slice(-24);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
        {visible.map((d, i) => {
          const pct = (d.count / max) * 100;
          const color = d.count === 0 ? '#1e293b' : d.count > 3 ? '#ef4444' : '#f59e0b';
          return (
            <div key={i} title={`${d.time}: ${d.count} errors`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'default' }}>
              <div style={{
                width: '100%', borderRadius: '2px 2px 0 0',
                height: `${Math.max(pct, 8)}%`,
                background: color, opacity: 0.9,
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = '1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = '0.9'; }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[0, 11, 23].map(idx => (
          <span key={idx} style={{ fontSize: 10, color: '#334155' }}>{visible[idx]?.time ?? ''}</span>
        ))}
      </div>
    </div>
  );
}

// ── Overall status banner ────────────────────────────────────────────────────

function OverallBanner({ services }: { services: ServiceHealth[] }) {
  const downCount      = services.filter(s => s.status === 'down').length;
  const degradedCount  = services.filter(s => s.status === 'degraded').length;
  const status: HealthStatus = downCount > 0 ? 'down' : degradedCount > 0 ? 'degraded' : 'healthy';
  const meta = STATUS_META[status];
  const message =
    status === 'healthy'  ? 'All systems operational' :
    status === 'degraded' ? `${degradedCount} service${degradedCount > 1 ? 's' : ''} degraded` :
                            `${downCount} service${downCount > 1 ? 's' : ''} down`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 12, background: meta.bg, border: `1px solid ${meta.color}30`, marginBottom: 24 }}>
      {meta.icon}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: meta.color }}>{message}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Last updated just now</div>
      </div>
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, unit, color }: {
  icon: React.ReactNode; label: string; value: string | number; unit?: string; color: string;
}) {
  return (
    <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: '#334155' }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [demo] = useState(buildDemo);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [errorRate, setErrorRate] = useState<ErrorPoint[]>([]);
  const [requestsPerMin, setRequestsPerMin] = useState(0);
  const [p50, setP50] = useState(0);
  const [p99, setP99] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    // In production, hit a real health-check API. For now, use demo data.
    await new Promise(r => setTimeout(r, 400));
    setServices(demo.services);
    setErrorRate(demo.errorRate);
    setRequestsPerMin(demo.requestsPerMin);
    setP50(demo.p50);
    setP99(demo.p99);
    setLastRefresh(new Date());
    setLoading(false);
  }, [demo]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const healthyCount  = services.filter(s => s.status === 'healthy').length;
  const degradedCount = services.filter(s => s.status === 'degraded').length;
  const downCount     = services.filter(s => s.status === 'down').length;

  return (
    <div style={{ padding: '28px 28px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 22, color: '#f1f5f9', margin: 0 }}>Monitoring</h1>
          <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 0' }}>
            System health · refreshes every 30s · last update {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#12131e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#94a3b8', cursor: 'pointer' }}>
          <RefreshCw size={13} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {loading && !services.length ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.3)', borderTopColor: '#34d399', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Overall status */}
          <OverallBanner services={services} />

          {/* Key metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
            <MetricCard icon={<Globe    size={15} color="#22c55e" />} label="Requests / min"  value={requestsPerMin} color="#22c55e" />
            <MetricCard icon={<Clock    size={15} color="#8b5cf6" />} label="Median latency"  value={p50}  unit="ms" color="#8b5cf6" />
            <MetricCard icon={<Zap      size={15} color="#f59e0b" />} label="P99 latency"     value={p99}  unit="ms" color="#f59e0b" />
            <MetricCard icon={<CheckCircle size={15} color="#34d399" />} label="Services up"  value={healthyCount}  unit={`/ ${services.length}`} color="#34d399" />
            {degradedCount > 0 && <MetricCard icon={<AlertTriangle size={15} color="#f59e0b" />} label="Degraded" value={degradedCount} color="#f59e0b" />}
            {downCount > 0     && <MetricCard icon={<XCircle size={15} color="#ef4444" />}      label="Down"     value={downCount}     color="#ef4444" />}
          </div>

          {/* Services table + Error chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
            {/* Services */}
            <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={15} color="#34d399" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Service Status</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Service', 'Status', 'Latency', 'Uptime', 'Last Check', 'Detail'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map(svc => {
                    const meta = STATUS_META[svc.status];
                    return (
                      <tr key={svc.name} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'none'; }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#e2e8f0' }}>{svc.name}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: meta.bg, color: meta.color }}>
                            {meta.icon}{meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: svc.latency > 500 ? '#f59e0b' : '#94a3b8', fontFamily: 'monospace', fontSize: 12 }}>
                          {svc.latency}ms
                        </td>
                        <td style={{ padding: '12px 16px', color: svc.uptime >= 99.9 ? '#22c55e' : svc.uptime >= 99 ? '#f59e0b' : '#ef4444', fontFamily: 'monospace', fontSize: 12 }}>
                          {svc.uptime}%
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155', fontSize: 11 }}>{timeAgo(svc.lastChecked)}</td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12, maxWidth: 220 }}>{svc.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Error rate chart */}
              <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Cpu size={14} color="#f59e0b" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Error Rate (24h)</span>
                </div>
                <ErrorChart data={errorRate} />
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b' }} />
                    <span style={{ fontSize: 10, color: '#64748b' }}>1–3 errors</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} />
                    <span style={{ fontSize: 10, color: '#64748b' }}>4+ errors</span>
                  </div>
                </div>
              </div>

              {/* Uptime summary */}
              <div style={{ background: '#12131e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Database size={14} color="#8b5cf6" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>Uptime Summary</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {services.map(svc => {
                    const pct = svc.uptime;
                    const color = pct >= 99.9 ? '#22c55e' : pct >= 99 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={svc.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{svc.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
