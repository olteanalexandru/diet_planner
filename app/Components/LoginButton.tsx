'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export const LoginButton: React.FC = () => {
  const { user, error, isLoading } = useUser();
  const { t } = useLanguage();

  if (isLoading) return <div className="text-sm text-space-400">{t('auth.loading')}</div>;
  if (error) return <div className="text-sm text-red-400">Error: {error.message}</div>;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-space-300 hidden lg:inline">{t('auth.welcome', { name: user.name || '' })}</span>
        <button
          className="btn-cyber-outline px-4 py-1.5 text-sm"
          onClick={() => {
            window.location.href = '/api/auth/logout';
          }}
        >
          {t('auth.logout')}
        </button>
      </div>
    );
  }

  return (
    <Link href="/api/auth/login" className="btn-cyber-outline px-4 py-1.5 text-sm">
      {t('auth.login')}
    </Link>
  );
};
