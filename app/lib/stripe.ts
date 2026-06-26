import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured: STRIPE_SECRET_KEY is missing.');
    }
    client = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-09-30.acacia',
    });
  }
  return client;
}
