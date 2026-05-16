import Stripe from 'stripe';

// Lazy singleton — only instantiated on first use (not at build time),
// so Next.js static analysis during `next build` doesn't require the key.
let _stripe: Stripe | null = null;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
      _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
    }
    const value = (_stripe as never)[prop as never];
    return typeof value === 'function' ? value.bind(_stripe) : value;
  },
});
