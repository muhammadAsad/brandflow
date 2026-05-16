'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, Tag, CheckCircle, XCircle, Loader } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';

// ── Promo validation result ───────────────────────────────────────────────────

interface PromoResult {
  valid: boolean;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  applies_to_plan?: string | null;
  description?: string;
  reason?: 'expired' | 'not_found' | 'max_uses_reached';
}

function promoErrorMsg(reason: string) {
  if (reason === 'expired')         return 'This promo code has expired.';
  if (reason === 'max_uses_reached') return 'This promo code has reached its usage limit.';
  return 'Invalid promo code.';
}

function discountLabel(result: PromoResult) {
  if (!result.valid) return '';
  if (result.discount_type === 'percentage') return `${result.discount_value}% off`;
  if (result.discount_type === 'fixed') return `$${((result.discount_value ?? 0) / 100).toFixed(0)} off`;
  return '';
}

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function RegisterForm() {
  const searchParams = useSearchParams();
  const urlPromo     = searchParams.get('promo')?.toUpperCase() ?? '';

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [promoCode, setPromoCode]     = useState(urlPromo);
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [registrationsOpen, setRegistrationsOpen] = useState<boolean | null>(null); // null = loading
  const router  = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Check if registrations are open ───────────────────────────────────────
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((d: { allow_registrations: boolean }) => setRegistrationsOpen(d.allow_registrations !== false))
      .catch(() => setRegistrationsOpen(true)); // default open on error
  }, []);

  // ── Validate promo from URL on mount ───────────────────────────────────────
  useEffect(() => {
    if (urlPromo) validatePromo(urlPromo);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced validation on manual input ───────────────────────────────────
  useEffect(() => {
    if (!promoCode || promoCode === urlPromo) return; // skip URL-pre-filled (already validated above)
    setPromoResult(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validatePromo(promoCode), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [promoCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function validatePromo(code: string) {
    if (!code.trim()) { setPromoResult(null); return; }
    setPromoLoading(true);
    try {
      const res  = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(code.trim())}`);
      const json = await res.json() as PromoResult;
      setPromoResult(json);
    } catch {
      setPromoResult({ valid: false, reason: 'not_found' });
    } finally { setPromoLoading(false); }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            promo_code: promoResult?.valid ? promoCode.trim().toUpperCase() : undefined,
          },
        },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (data.session) {
        // If a valid promo is attached, pass it through to the session/dashboard
        const dest = promoResult?.valid
          ? `/?promo=${encodeURIComponent(promoCode.trim().toUpperCase())}`
          : '/';
        router.push(dest);
        router.refresh();
        return;
      }

      setError('Check your email to confirm your account, then sign in.');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally { setLoading(false); }
  };

  const isUrlPromo = !!urlPromo;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5ff', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 16px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Flame size={26} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>Create your account</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#94a3b8' }}>Start growing your brand smarter</p>
        </div>

        {/* Registrations closed */}
        {registrationsOpen === false && (
          <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12, padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Registrations Closed</div>
            <div style={{ fontSize: 14, color: '#78350f' }}>New sign-ups are temporarily disabled. Please check back later or contact support.</div>
            <Link href="/login" style={{ display: 'inline-block', marginTop: 16, fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        )}

        {/* Form — only shown when registrations are open (or still loading) */}
        {registrationsOpen !== false && (<>

        {/* Promo banner (URL-applied code) */}
        {isUrlPromo && promoResult?.valid && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#f0fdf4', border: '1.5px solid #86efac',
            borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          }}>
            <Tag size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#15803d' }}>
                Promo code <span style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{urlPromo}</span> applied!
              </div>
              <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                {discountLabel(promoResult)} off your first month
                {promoResult.description ? ` — ${promoResult.description}` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 4px 24px rgba(124,58,237,0.08)', border: '1px solid #ede9fe' }}>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Arjun Mehta" required style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required style={inputStyle} />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" required minLength={6} style={inputStyle} />
            </div>

            {/* Promo code */}
            <div>
              <label style={labelStyle}>
                Promo Code <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Tag size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="LAUNCH50"
                  readOnly={isUrlPromo}
                  style={{
                    ...inputStyle,
                    paddingLeft: 36,
                    paddingRight: 36,
                    background: isUrlPromo ? '#f0fdf4' : '#fafaf9',
                    borderColor: promoResult?.valid ? '#86efac' : promoResult?.valid === false ? '#fca5a5' : '#e2e8f0',
                    color: isUrlPromo ? '#15803d' : '#1e293b',
                    fontFamily: promoCode ? 'monospace' : 'inherit',
                    letterSpacing: promoCode ? '0.05em' : 'normal',
                  }}
                />
                {/* Status icon */}
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                  {promoLoading && <Loader size={14} color="#94a3b8" style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {!promoLoading && promoResult?.valid === true  && <CheckCircle size={14} color="#16a34a" />}
                  {!promoLoading && promoResult?.valid === false && <XCircle size={14} color="#ef4444" />}
                </div>
              </div>

              {/* Promo feedback */}
              {promoResult?.valid === true && (
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={11} /> {discountLabel(promoResult)} off your first month
                  {promoResult.description && ` — ${promoResult.description}`}
                </div>
              )}
              {promoResult?.valid === false && (
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <XCircle size={11} /> {promoErrorMsg(promoResult.reason ?? 'not_found')}
                </div>
              )}
            </div>

            {/* Error / success message */}
            {error && (
              <div style={{
                background: error.startsWith('Check') ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${error.startsWith('Check') ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: 10, padding: '10px 14px', fontSize: 13,
                color: error.startsWith('Check') ? '#15803d' : '#dc2626',
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              height: 46, borderRadius: 12,
              background: loading ? '#a78bfa' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
              border: 'none', color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s',
            }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>

        </>)} {/* end registrationsOpen !== false */}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', height: 44, borderRadius: 10, border: '1.5px solid #e2e8f0',
  padding: '0 14px', fontSize: 14, color: '#1e293b', outline: 'none',
  boxSizing: 'border-box', background: '#fafaf9',
};

// ── Page export — Suspense boundary for useSearchParams ───────────────────────

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5ff' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.3)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
