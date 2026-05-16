'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Tag, CheckCircle, XCircle, Loader, Zap, Building2, Sparkles,
  Check, ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PromoResult {
  valid: boolean;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  applies_to_plan?: string | null;
  description?: string | null;
  reason?: 'expired' | 'not_found' | 'max_uses_reached';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function promoErrorMsg(reason: string) {
  if (reason === 'expired')          return 'This promo code has expired.';
  if (reason === 'max_uses_reached') return 'This promo code has reached its usage limit.';
  return 'Invalid promo code.';
}

function discountLabel(result: PromoResult) {
  if (!result.valid) return '';
  if (result.discount_type === 'percentage') return `${result.discount_value}% off`;
  if (result.discount_type === 'fixed') return `$${((result.discount_value ?? 0) / 100).toFixed(0)} off`;
  return '';
}

// ── Plan definitions ──────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'pro' as const,
    label: 'Pro',
    price: 29,
    icon: <Zap size={18} color="#a78bfa" />,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
    features: ['Unlimited posts', '10 social accounts', 'AI content generation', 'Analytics dashboard', 'Priority support'],
  },
  {
    key: 'enterprise' as const,
    label: 'Enterprise',
    price: 99,
    icon: <Building2 size={18} color="#fbbf24" />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
    features: ['Everything in Pro', 'Unlimited social accounts', 'Team collaboration', 'Custom integrations', 'Dedicated account manager', 'SLA uptime guarantee'],
  },
];

// ── Promo input component ─────────────────────────────────────────────────────

function PromoInput({ value, onChange, result, loading }: {
  value: string;
  onChange: (v: string) => void;
  result: PromoResult | null;
  loading: boolean;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
        Have a promo code?
      </label>
      <div style={{ position: 'relative', maxWidth: 320 }}>
        <Tag size={14} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="Enter code (e.g. LAUNCH50)"
          style={{
            width: '100%', height: 42, borderRadius: 10, boxSizing: 'border-box',
            paddingLeft: 36, paddingRight: 36, fontSize: 13,
            border: `1.5px solid ${result?.valid === true ? '#86efac' : result?.valid === false ? '#fca5a5' : '#e2e8f0'}`,
            outline: 'none', background: '#fafaf9', color: '#1e293b',
            fontFamily: value ? 'monospace' : 'inherit', letterSpacing: value ? '0.05em' : 'normal',
          }}
        />
        <div style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }}>
          {loading                       && <Loader      size={14} color="#94a3b8" style={{ animation: 'spin 0.8s linear infinite' }} />}
          {!loading && result?.valid === true  && <CheckCircle size={14} color="#16a34a" />}
          {!loading && result?.valid === false && <XCircle     size={14} color="#ef4444" />}
        </div>
      </div>

      {result?.valid === true && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
          <CheckCircle size={12} />
          {discountLabel(result)} off your first month
          {result.applies_to_plan && ` (${result.applies_to_plan} plan only)`}
          {result.description && ` — ${result.description}`}
        </div>
      )}
      {result?.valid === false && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#dc2626' }}>
          <XCircle size={12} /> {promoErrorMsg(result.reason ?? 'not_found')}
        </div>
      )}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, currentPlan, promoResult, promoCode, onUpgrade, upgrading }: {
  plan: typeof PLANS[number];
  currentPlan: string;
  promoResult: PromoResult | null;
  promoCode: string;
  onUpgrade: (plan: string) => void;
  upgrading: string | null;
}) {
  const isCurrent = currentPlan === plan.key;
  const isUpgrading = upgrading === plan.key;

  // Show discounted price if promo applies to this plan or is universal
  const showDiscount = promoResult?.valid &&
    (!promoResult.applies_to_plan || promoResult.applies_to_plan === plan.key);

  const discountedPrice = showDiscount
    ? promoResult!.discount_type === 'percentage'
      ? plan.price * (1 - (promoResult!.discount_value ?? 0) / 100)
      : plan.price - (promoResult!.discount_value ?? 0) / 100
    : null;

  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `2px solid ${isCurrent ? plan.color : '#ede9fe'}`,
      padding: '22px 24px', position: 'relative', flex: 1, minWidth: 240,
    }}>
      {isCurrent && (
        <div style={{
          position: 'absolute', top: -11, left: 20,
          background: plan.color, color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '2px 10px', borderRadius: 20, letterSpacing: '0.06em',
        }}>CURRENT PLAN</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: plan.bg, border: `1px solid ${plan.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {plan.icon}
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{plan.label}</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {showDiscount && discountedPrice !== null ? (
            <>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>${discountedPrice.toFixed(0)}</span>
              <span style={{ fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>${plan.price}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>/mo</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>${plan.price}</span>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>/mo</span>
            </>
          )}
        </div>
        {showDiscount && (
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, marginTop: 2 }}>
            {discountLabel(promoResult!)} off first month with code
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
            <Check size={13} color={plan.color} />
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => !isCurrent && onUpgrade(plan.key)}
        disabled={isCurrent || isUpgrading}
        style={{
          width: '100%', height: 40, borderRadius: 10, border: 'none',
          background: isCurrent ? '#f1f5f9' : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
          color: isCurrent ? '#94a3b8' : '#fff',
          fontSize: 14, fontWeight: 700,
          cursor: isCurrent ? 'default' : isUpgrading ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        {isUpgrading ? (
          <><Loader size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Redirecting…</>
        ) : isCurrent ? (
          'Current Plan'
        ) : (
          <><Sparkles size={13} /> Upgrade to {plan.label}</>
        )}
      </button>
    </div>
  );
}

// ── Billing section ───────────────────────────────────────────────────────────

function BillingSection({ currentPlan }: { currentPlan: string }) {
  const searchParams        = useSearchParams();
  const checkoutStatus      = searchParams.get('checkout');

  const [promoCode, setPromoCode]         = useState('');
  const [promoResult, setPromoResult]     = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [upgrading, setUpgrading]         = useState<string | null>(null);
  const [upgradeError, setUpgradeError]   = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced promo validation
  useEffect(() => {
    setPromoResult(null);
    if (!promoCode.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPromoLoading(true);
      try {
        const res  = await fetch(`/api/promo-codes/validate?code=${encodeURIComponent(promoCode.trim())}`);
        const json = await res.json() as PromoResult;
        setPromoResult(json);
      } catch {
        setPromoResult({ valid: false, reason: 'not_found' });
      } finally { setPromoLoading(false); }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [promoCode]);

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    setUpgradeError('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          promoCode: promoResult?.valid ? promoCode.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setUpgradeError(json.error ?? 'Failed to create checkout session.');
        setUpgrading(null);
      }
    } catch {
      setUpgradeError('Something went wrong. Please try again.');
      setUpgrading(null);
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Billing & Plan</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: '#94a3b8' }}>
        Manage your subscription and apply promo codes.
      </p>

      {/* Checkout status banners */}
      {checkoutStatus === 'success' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
          <CheckCircle size={15} /> Your plan has been upgraded successfully!
        </div>
      )}
      {checkoutStatus === 'canceled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef9ef', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#92400e' }}>
          Checkout was canceled — no charges made.
        </div>
      )}

      {/* Current plan badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: '#f8f7ff', borderRadius: 10, border: '1px solid #ede9fe' }}>
        <div style={{ fontSize: 13, color: '#64748b' }}>Current plan:</div>
        <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 20, background: currentPlan === 'free' ? '#f1f5f9' : currentPlan === 'pro' ? 'rgba(139,92,246,0.12)' : 'rgba(245,158,11,0.12)', color: currentPlan === 'free' ? '#64748b' : currentPlan === 'pro' ? '#7c3aed' : '#d97706' }}>
          {currentPlan}
        </span>
        {currentPlan !== 'free' && (
          <a href="https://billing.stripe.com/p/login" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
            Manage billing <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* Promo code input */}
      {currentPlan === 'free' && (
        <PromoInput
          value={promoCode}
          onChange={setPromoCode}
          result={promoResult}
          loading={promoLoading}
        />
      )}

      {/* Plan cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {PLANS.map(plan => (
          <PlanCard
            key={plan.key}
            plan={plan}
            currentPlan={currentPlan}
            promoResult={promoResult}
            promoCode={promoCode}
            onUpgrade={handleUpgrade}
            upgrading={upgrading}
          />
        ))}
      </div>

      {upgradeError && (
        <div style={{ marginTop: 14, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
          <XCircle size={13} /> {upgradeError}
        </div>
      )}
    </div>
  );
}

// ── Full settings page ────────────────────────────────────────────────────────

function SettingsContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(124,58,237,0.2)', borderTopColor: '#7c3aed', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 840, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Settings</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Full Name', val: user?.full_name ?? '' },
            { label: 'Email',     val: user?.email ?? '' },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
              <input defaultValue={f.val} style={{ width: '100%', height: 40, borderRadius: 8, border: '1.5px solid #e2e8f0', padding: '0 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#fafaf9', color: '#1e293b' }} />
            </div>
          ))}
        </div>
        <button style={{ height: 38, padding: '0 18px', borderRadius: 8, background: '#7c3aed', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Save Changes
        </button>
      </div>

      {/* Billing & Plan */}
      <BillingSection currentPlan={user?.plan ?? 'free'} />

      {/* Notifications */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #ede9fe', boxShadow: '0 2px 12px rgba(124,58,237,0.06)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Notifications</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['Email notifications', 'Push notifications', 'Weekly digest', 'Campaign alerts'].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{n}</span>
              <div style={{ width: 36, height: 20, borderRadius: 10, background: '#7c3aed', cursor: 'pointer', position: 'relative' }}>
                <div style={{ position: 'absolute', right: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid #fecaca', boxShadow: '0 2px 12px rgba(239,68,68,0.04)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Danger Zone</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#94a3b8' }}>Permanently delete your account and all data. This cannot be undone.</p>
        <button style={{ height: 36, padding: '0 16px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Delete Account
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
