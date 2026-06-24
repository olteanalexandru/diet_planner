'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export const LoginButton: React.FC = () => {
  const { user, error, isLoading } = useUser();
  const { t } = useLanguage();

  if (isLoading) return <div>{t('auth.loading')}</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (user) {
    return (
      <div className="d-flex align-items-center">
        <span className="me-2">{t('auth.welcome', { name: user.name || '' })}</span>
        {/* <Link href="/api/auth/logout" className="btn btn-outline-light"> */}
        <button
          className="btn btn-outline-light"
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
    <Link href="/api/auth/login" className="btn btn-outline-light">
      {t('auth.login')}
    </Link>
  );
};