'use client';

import React, { Suspense, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { TranslationKey } from '../translations';

const FREE_FEATURE_KEYS: TranslationKey[] = [
  'pricing.free.feature.aiGenerations',
  'pricing.free.feature.createPublish',
  'pricing.free.feature.followLike',
  'pricing.free.feature.collections',
];

const PREMIUM_FEATURE_KEYS: TranslationKey[] = [
  'pricing.premium.feature.unlimitedAi',
  'pricing.premium.feature.mealPlanGenerator',
  'pricing.premium.feature.chefAssistant',
  'pricing.premium.feature.exclusiveRecipes',
  'pricing.premium.feature.unlimitedCollections',
  'pricing.premium.feature.shoppingList',
  'pricing.premium.feature.adFree',
];

function CheckoutResultBanner() {
  const searchParams = useSearchParams();
  const checkoutResult = searchParams.get('checkout');
  const { t } = useLanguage();

  if (checkoutResult === 'success') {
    return <p className="mt-4 text-green-400">{t('pricing.checkoutSuccess')}</p>;
  }
  if (checkoutResult === 'canceled') {
    return <p className="mt-4 text-yellow-400">{t('pricing.checkoutCanceled')}</p>;
  }
  return null;
}

function PricingContent() {
  const { user, isLoading: userLoading } = useUser();
  const { t } = useLanguage();
  const { status, loading: loadingStatus } = useSubscription();

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = status?.isPremium ?? false;

  const handleUpgrade = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/premium', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('pricing.error.startCheckout'));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.error.generic'));
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/premium/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('pricing.error.openPortal'));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pricing.error.generic'));
      setActionLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-space-50 mb-2">{t('pricing.title')}</h1>
        <p className="text-space-400">{t('pricing.subtitle')}</p>
        <Suspense fallback={null}>
          <CheckoutResultBanner />
        </Suspense>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-space-800 border border-space-700 rounded-xl p-8">
          <h2 className="text-xl font-bold text-space-50 mb-1">{t('pricing.free.title')}</h2>
          <p className="text-3xl font-bold text-space-50 mb-6">$0<span className="text-base text-space-400 font-normal">{t('pricing.perMonth')}</span></p>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-space-300">
                <Check size={18} className="text-space-400 mt-0.5 shrink-0" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
          {!userLoading && !isPremium && (
            <div className="text-center text-space-400 py-2">{t('pricing.free.currentPlan')}</div>
          )}
          {user && !loadingStatus && status && !isPremium && (
            <div className="mt-4 pt-4 border-t border-space-700 space-y-1 text-sm text-space-400">
              <p>
                {t('pricing.free.usageGenerations', {
                  used: status.generationsUsed,
                  limit: status.generationsLimit ?? 0,
                })}
              </p>
              <p>
                {t('pricing.free.usageCollections', {
                  used: status.collectionsUsed,
                  limit: status.collectionsLimit ?? 0,
                })}
              </p>
            </div>
          )}
        </div>

        <div className="bg-space-800 border-2 border-cyber-primary rounded-xl p-8 relative">
          <span className="absolute -top-3 right-6 bg-cyber-primary text-space-900 text-xs font-bold px-3 py-1 rounded-full">
            {t('pricing.premium.badge')}
          </span>
          <h2 className="text-xl font-bold text-space-50 mb-1">{t('pricing.premium.title')}</h2>
          <p className="text-3xl font-bold text-space-50 mb-6">$9<span className="text-base text-space-400 font-normal">{t('pricing.perMonth')}</span></p>
          <ul className="space-y-3 mb-8">
            {PREMIUM_FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2 text-space-300">
                <Check size={18} className="text-cyber-primary mt-0.5 shrink-0" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>

          {isPremium && (
            <div className="mb-4 text-center text-sm text-cyber-primary">
              {t('pricing.premium.usageUnlimited')}
            </div>
          )}

          {!user ? (
            <a
              href="/api/auth/login"
              className="block text-center w-full bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {t('pricing.loginToUpgrade')}
            </a>
          ) : loadingStatus ? (
            <div className="text-center text-space-400 py-2">{t('pricing.loading')}</div>
          ) : isPremium ? (
            <button
              onClick={handleManageSubscription}
              disabled={actionLoading}
              className="w-full bg-space-700 hover:bg-space-600 text-space-50 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? t('pricing.opening') : t('pricing.manageSubscription')}
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="w-full bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {actionLoading ? t('pricing.redirecting') : t('pricing.upgradeToPremium')}
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
