'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

interface PremiumUpsellProps {
  title?: string;
  message?: string;
}

export const PremiumUpsell: React.FC<PremiumUpsellProps> = ({
  title = 'Premium feature',
  message = 'Upgrade to Premium to unlock this.',
}) => {
  return (
    <div className="bg-space-800 border border-cyber-primary/40 rounded-xl p-6 text-center">
      <Lock className="mx-auto mb-3 text-cyber-primary" size={28} />
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-space-400 mb-4">{message}</p>
      <Link
        href="/pricing"
        className="inline-block bg-cyber-primary hover:bg-cyber-primary/80 text-space-900 font-bold py-2 px-4 rounded-lg transition-colors"
      >
        View plans
      </Link>
    </div>
  );
};
