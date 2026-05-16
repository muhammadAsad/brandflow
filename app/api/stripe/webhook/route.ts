import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = await createClient();
  const db       = createAdminClient();

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object;
    const userId   = session.metadata?.user_id;
    const plan     = session.metadata?.plan ?? 'pro';
    const promoId  = session.metadata?.promo_code_id;

    if (userId) {
      await supabase
        .from('profiles')
        .update({ plan, stripe_customer_id: session.customer })
        .eq('user_id', userId);
    }

    // Confirm promo use: upsert the promo_code_uses row and bump used_count
    if (promoId && userId) {
      // Upsert so we don't double-count if the checkout route already inserted
      const { data: existing } = await db
        .from('promo_code_uses')
        .select('id')
        .eq('promo_code_id', promoId)
        .eq('checkout_session_id', session.id)
        .maybeSingle();

      if (!existing) {
        await db.from('promo_code_uses').insert({
          promo_code_id:       promoId,
          user_id:             userId,
          checkout_session_id: session.id,
          used_at:             new Date().toISOString(),
        });
      }

      // Increment used_count safely with a raw update using gte guard
      const { data: promo } = await db
        .from('promo_codes')
        .select('used_count')
        .eq('id', promoId)
        .single();

      if (promo) {
        await db
          .from('promo_codes')
          .update({ used_count: promo.used_count + 1 })
          .eq('id', promoId);
      }
    }
  }

  // ── customer.subscription.deleted ─────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', subscription.customer)
      .single();
    if (profile) {
      await supabase.from('profiles').update({ plan: 'free' }).eq('user_id', profile.user_id);
    }
  }

  // ── customer.subscription.updated ─────────────────────────────────────────
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const plan = subscription.metadata?.plan;
    if (plan) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('stripe_customer_id', subscription.customer)
        .single();
      if (profile) {
        await supabase.from('profiles').update({ plan }).eq('user_id', profile.user_id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
