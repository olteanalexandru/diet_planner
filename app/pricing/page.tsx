'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';

const FREE_FEATURES = [
  '5 AI recipe generations per month',
  'Create and publish recipes',
  'Follow other cooks and like/comment',
  'Up to 3 recipe collections',
];

const PREMIUM_FEATURES = [
  'Unlimited AI recipe generations',
  'Access to premium-exclusive recipes',
  'Unlimited recipe collections',
  'Shopping list builder from your meal plan',
  'Ad-free experience',
];

function CheckoutResultBanner() {
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');

  if (checkoutResult === 'success') {
    return <p className="mt-4 text-green-400">Subscription activated! It may take a few seconds to reflect below.</p>;
  }
  if (checkoutResult === 'canceled') {
    return <p className="mt-4 text-yellow-400">Checkout canceled.</p>;
  }
  return null;
}

function PricingContent() {
  const { user, isLoading: userLoading } = useUser();

  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoadingStatus(false);
      return;
    }

    fetch(`/api/users/${user.sub}`)
      .then((res) => res.json())
      .then((data) => setSubscriptionStatus(data.user?.subscriptionStatus || 'free'))
      .catch(() => setError('Failed to load subscription status'))
      .finally(() => setLoadingStatus(false));
  }, [user]);

  const isPremium = subscriptionStatus === 'premium';

  const handleUpgrade = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/premium', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start checkout');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/premium/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to open billing portal');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-2">Plans &amp; Pricing</h1>
        <p className="text-space-400">Choose the plan that fits how you cook.</p>
        <Suspense fallback={null}>
          <CheckoutResultBanner />
        </Suspense>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-space-800 border border-space-700 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-1">Free</h2>
          <p className="text-3xl font-bold text-white mb-6">$0<span className="text-base text-space-400 font-normal">/month</span></p>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-space-300">
                <Check size={18} className="text-space-400 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {!userLoading && !isPremium && (
            <div className="text-center text-space-400 py-2">Your current plan</div>
          )}
        </div>

        <div className="bg-space-800 border-2 border-cyber-primary rounded-xl p-8 relative">
          <span className="absolute -top-3 right-6 bg-cyber-primary text-space-900 text-xs font-bold px-3 py-1 rounded-full">
            PREMIUM
          </span>
          <h2 className="text-xl font-bold text-white mb-1">Premium</h2>
          <p className="text-3xl font-bold text-white mb-6">$9<span className="text-base text-space-400 font-normal">/month</span></p>
          <ul className="space-y-3 mb-8">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-space-300">
                <Check size={18} className="text-cyber-primary mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {!user ? (
            <a
              href="/api/auth/login"
              className="block text-center w-full bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Log in to upgrade
            </a>
          ) : loadingStatus ? (
            <div className="text-center text-space-400 py-2">Loading...</div>
          ) : isPremium ? (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="w-full bg-space-700 hover:bg-space-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Opening...' : 'Manage subscription'}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="w-full bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? 'Redirecting...' : 'Upgrade to Premium'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return <PricingContent />;
}
