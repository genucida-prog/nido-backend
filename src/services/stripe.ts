import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia',
});

export const PRICES = {
  silver: process.env.STRIPE_PRICE_SILVER || 'price_silver',
  gold: process.env.STRIPE_PRICE_GOLD || 'price_gold',
  platinum: process.env.STRIPE_PRICE_PLATINUM || 'price_platinum',
};

export { stripe };
export default stripe;