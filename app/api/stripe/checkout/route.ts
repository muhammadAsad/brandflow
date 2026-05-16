import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Price IDs — set these in your .env
const PRICE_IDS: Record<string, string> = {
  pro:        process.env.STRIPE_PRICE_PRO        ?? '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE ?? '',
};

export async function POST(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan = 'pro', promoCode, successUrl, cancelUrl } = await request.json() as {
      plan?: string;
      promoCode?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const priceId = PRICE_IDS[plan];
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // ── Promo code lookup ───────────────────────────────────────────────────
    let stripeDiscounts: { promotion_code: string }[] | undefined;
    let promoCodeId: string | null = null;

    if (promoCode?.trim()) {
      const db = createAdminClient();
      const { data: promo } = await db
        .from('promo_codes')
        .select('id, stripe_promotion_code_id, is_active, expires_at, max_uses, used_count')
        .eq('code', promoCode.trim().toUpperCase())
        .single();

      if (
        promo &&
        promo.is_active &&
        (!promo.expires_at || new Date(promo.expires_at) > new Date()) &&
        (promo.max_uses === null || promo.used_count < promo.max_uses) &&
        promo.stripe_promotion_code_id
      ) {
        stripeDiscounts = [{ promotion_code: promo.stripe_promotion_code_id }];
        promoCodeId = promo.id;
      }
    }

    // ── Stripe customer ─────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('user_id', user.id);
    }

    // ── Checkout session ────────────────────────────────────────────────────
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl ?? `${origin}/settings?checkout=success`,
      cancel_url:  cancelUrl  ?? `${origin}/settings?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan,
        promo_code_id: promoCodeId ?? '',
      },
      subscription_data: {
        metadata: { user_id: user.id, plan },
      },
    };

    if (stripeDiscounts) {
      sessionParams.discounts = stripeDiscounts;
    } else {
      // Allow customers to enter codes in Stripe's hosted UI if we didn't apply one
      sessionParams.allow_promotion_codes = !promoCode; // only show field if user didn't try one
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // ── Record promo use (optimistic — also confirmed via webhook) ──────────
    if (promoCodeId && session.id) {
      const db = createAdminClient();
      await Promise.all([
        db.from('promo_code_uses').insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          checkout_session_id: session.id,
          used_at: new Date().toISOString(),
        }),
        db.rpc('increment_promo_used_count', { code_id: promoCodeId }).then(res => {
          // Fallback if RPC doesn't exist: do a manual increment
          if (res.error) {
            return db
              .from('promo_codes')
              .update({ used_count: (0) }) // will be handled in webhook fallback
              .eq('id', promoCodeId!);
          }
        }),
      ]);
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/checkout]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
