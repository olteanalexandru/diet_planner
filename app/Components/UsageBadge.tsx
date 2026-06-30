'use client';

import React from 'react';
import { Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { useLanguage } from '../context/LanguageContext';

interface UsageBadgeProps {
  className?: string;
}

export const UsageBadge: React.FC<UsageBadgeProps> = ({ className = '' }) => {
  const { status, loading } = useSubscription();
  const { t } = useLanguage();

  if (loading || !status) return null;

  if (status.isPremium) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-cyber-primary text-space-900 ${className}`}
      >
        <Crown size={11} />
        {t('subscription.premiumBadge')}
      </span>
    );
  }

  const remaining = status.generationsRemaining ?? 0;
  const atLimit = remaining <= 0;

  return (
    <span
      title={t('subscription.generationsRemaining', { remaining, limit: status.generationsLimit ?? 0 })}
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
        atLimit ? 'bg-red-500/20 text-red-400' : 'bg-cyber-primary/20 text-cyber-primary'
      } ${className}`}
    >
      <Sparkles size={11} />
      {atLimit ? t('subscription.limitReached') : t('subscription.usageShort', { remaining, limit: status.generationsLimit ?? 0 })}
    </span>
  );
};
