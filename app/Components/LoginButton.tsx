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
        {/* <Link href="/api/auth/logout" className="btn btn-outline-light"> */}
        <button
          className="btn btn-outline-light"
          onClick={async () => {
            try {
              const response = await fetch('/api/ClearDatabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
              });

              if (!response.ok) {
          throw new Error('Network response was not ok');
              }

              // Optionally, handle the response data here
              console.log('Database cleared successfully');
            } catch (error) {
              console.error('Failed to clear database:', error);
            }

            // Log out the user
            window.location.href = '/api/auth/logout';
          }}
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <Link href="/api/auth/login" className="btn btn-outline-light">
      Log In
    </Link>
  );
};