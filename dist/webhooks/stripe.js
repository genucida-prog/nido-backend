"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_2 = require("express");
const stripe_1 = require("../services/stripe");
const db_1 = require("../lib/db");
const router = (0, express_2.Router)();
// Raw body for webhook signature verification
router.use(express_1.default.raw({ type: 'application/json' }));
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const body = req.body;
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle event idempotently
    const eventId = event.id;
    // Check if already processed
    const { data: existing } = await db_1.adminSupabase
        .from('stripe_events')
        .select('id')
        .eq('event_id', eventId)
        .single();
    if (existing) {
        return res.status(200).json({ received: true });
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const circleId = session.metadata?.circleId;
                const tier = session.metadata?.tier;
                if (userId && circleId && tier) {
                    // Create or update membership
                    await db_1.adminSupabase
                        .from('memberships')
                        .upsert({
                        user_id: userId,
                        circle_id: circleId,
                        tier,
                        status: 'active',
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: session.subscription,
                        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    }, { onConflict: 'user_id,circle_id' });
                    // Send welcome email
                    // await sendEmail('membership_upgrade', { userId, tier });
                }
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                // Update membership tier/status in DB
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                // Set membership to cancelled
                await db_1.adminSupabase
                    .from('memberships')
                    .update({ status: 'cancelled' })
                    .eq('stripe_subscription_id', subscription.id);
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                // Notify user of payment failure
                break;
            }
        }
        // Mark event as processed
        await db_1.adminSupabase.from('stripe_events').insert({
            event_id: eventId,
            type: event.type,
            created_at: new Date(),
        });
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
