'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PremiumUpsellProps {
  title?: string;
  message?: string;
}

export const PremiumUpsell: React.FC<PremiumUpsellProps> = ({ title, message }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-space-800 border border-cyber-primary/40 rounded-xl p-6 text-center">
      <Lock className="mx-auto mb-3 text-cyber-primary" size={28} />
      <h3 className="text-lg font-bold text-space-50 mb-1">{title ?? t('premiumUpsell.defaultTitle')}</h3>
      <p className="text-space-400 mb-4">{message ?? t('premiumUpsell.defaultMessage')}</p>
      <Link
        href="/pricing"
        className="inline-block bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors"
      >
        {t('premiumUpsell.viewPlans')}
      </Link>
    </div>
  );
};
