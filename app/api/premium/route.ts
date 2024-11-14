import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
// import Stripe from 'stripe';

// const prisma = new PrismaClient();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' });

export async function POST(req: NextRequest, res: NextResponse) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // const stripeSession = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price: process.env.STRIPE_PRICE_ID,
    //       quantity: 1,
    //     },
    //   ],
    //   mode: 'subscription',
    //   success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${req.headers.origin}/canceled`,
    //   customer_email: session.user.email,
    // });
    console.log("premium route ")

 
  } catch (error) {
    console.error('Error creating checkout session:', error);

  }
}