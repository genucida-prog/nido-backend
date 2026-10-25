import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';

const router = Router();

// Stripe webhook handler
router.post('/', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const body = JSON.stringify(req.body);

  // For now, skip signature verification in development
  // In production, verify with STRIPE_WEBHOOK_SECRET
  if (process.env.NODE_ENV === 'production' && process.env.STRIPE_WEBHOOK_SECRET) {
    const stripe = (await import('../services/stripe')).default;
    try {
      const event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      await handleWebhook(event);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Development mode: trust the body directly
    await handleWebhook(req.body);
  }

  res.json({ received: true });
});

async function handleWebhook(event: any) {
  const eventId = event.id;
  
  // Check if already processed
  const { data: existing } = await adminSupabase
    .from('stripe_events')
    .select('id')
    .eq('event_id', eventId)
    .single();

  if (existing) return;

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const circleId = session.metadata?.circleId;
        const tier = session.metadata?.tier;

        if (userId && circleId && tier) {
          await adminSupabase.from('memberships').upsert({
            user_id: userId,
            circle_id: circleId,
            tier,
            status: 'active',
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }, { onConflict: 'user_id,circle_id' });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Update membership tier in DB
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await adminSupabase
          .from('memberships')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        // Notify user of payment failure
        break;
      }
    }

    // Mark event as processed
    await adminSupabase.from('stripe_events').insert({
      event_id: eventId,
      type: event.type,
      created_at: new Date(),
    });
  } catch (error) {
    console.error('Webhook handler error:', error);
    throw error;
  }
}

export default router;