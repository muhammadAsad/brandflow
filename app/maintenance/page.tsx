export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0b14',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🔧</div>
        <h1 style={{ fontWeight: 800, fontSize: 32, color: '#f1f5f9', margin: '0 0 12px' }}>
          We&rsquo;ll be back soon
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
          BrandFlow is currently undergoing scheduled maintenance. We&rsquo;ll be back online shortly. Thank you for your patience.
        </p>
        <div style={{ padding: '14px 20px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, display: 'inline-block' }}>
          <span style={{ fontSize: 13, color: '#a78bfa' }}>Estimated downtime: less than 1 hour</span>
        </div>
      </div>
    </div>
  );
}
