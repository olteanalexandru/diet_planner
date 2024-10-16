'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export const LoginButton: React.FC = () => {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (user) {
    return (
      <div className="d-flex align-items-center">
        <span className="me-2">Welcome, {user.name}!</span>
        <Link href="/api/auth/logout" className="btn btn-outline-light">
          Log Out
        </Link>
      </div>
    );
  }

  return (
    <Link href="/api/auth/login" className="btn btn-outline-light">
      Log In
    </Link>
  );
};