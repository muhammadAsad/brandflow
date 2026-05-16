import Stripe from 'stripe';

// Falls back to a dummy key at build time so `next build` never crashes.
// At runtime Fly.io injects the real STRIPE_SECRET_KEY secret.
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY ?? 'sk_test_build_placeholder',
  { apiVersion: '2026-04-22.dahlia' }
);
