"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
// Stripe webhook handler
router.post('/', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const body = JSON.stringify(req.body);
    // For now, skip signature verification in development
    // In production, verify with STRIPE_WEBHOOK_SECRET
    if (process.env.NODE_ENV === 'production' && process.env.STRIPE_WEBHOOK_SECRET) {
        const stripe = (await Promise.resolve().then(() => __importStar(require('../services/stripe')))).default;
        try {
            const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
            await handleWebhook(event);
        }
        catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
    else {
        // Development mode: trust the body directly
        await handleWebhook(req.body);
    }
    res.json({ received: true });
});
async function handleWebhook(event) {
    const eventId = event.id;
    // Check if already processed
    const { data: existing } = await db_1.adminSupabase
        .from('stripe_events')
        .select('id')
        .eq('event_id', eventId)
        .single();
    if (existing)
        return;
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.metadata?.userId;
                const circleId = session.metadata?.circleId;
                const tier = session.metadata?.tier;
                if (userId && circleId && tier) {
                    await db_1.adminSupabase.from('memberships').upsert({
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
                await db_1.adminSupabase
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
        await db_1.adminSupabase.from('stripe_events').insert({
            event_id: eventId,
            type: event.type,
            created_at: new Date(),
        });
    }
    catch (error) {
        console.error('Webhook handler error:', error);
        throw error;
    }
}
exports.default = router;
