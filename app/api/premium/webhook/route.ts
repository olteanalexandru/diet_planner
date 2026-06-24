import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '../../../lib/stripe';
import prisma from '../../../lib/db';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function setSubscriptionFromStripe(customerId: string, subscription: Stripe.Subscription | null) {
  const user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
  if (!user) return;

  if (!subscription || subscription.status === 'canceled' || subscription.status === 'unpaid') {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'free',
        stripeSubscriptionId: null,
        subscriptionPeriodEnd: null,
      },
    });
    return;
  }

  const isActive = subscription.status === 'active' || subscription.status === 'trialing';
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: isActive ? 'premium' : 'free',
      stripeSubscriptionId: subscription.id,
      subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let stripe: Stripe;
  let event: Stripe.Event;
  try {
    stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        if (checkoutSession.customer && checkoutSession.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string
          );
          await setSubscriptionFromStripe(checkoutSession.customer as string, subscription);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await setSubscriptionFromStripe(subscription.customer as string, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await setSubscriptionFromStripe(subscription.customer as string, null);
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling Stripe webhook event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
