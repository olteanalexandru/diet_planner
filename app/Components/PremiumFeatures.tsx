// app/Components/PremiumFeatures.tsx

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export const PremiumFeatures: React.FC = () => {
  const { user, error, isLoading } = useUser();
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    try {
      const response = await fetch('/api/premium', { method: 'POST' });
      const { sessionId } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = `/api/checkout_sessions/${sessionId}`;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      setUpgradeError('An error occurred while upgrading. Please try again.');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mt-5">
      <h2>Premium Features</h2>
      {user?.subscriptionStatus === 'premium' ? (
        <div>
          <p>Thank you for being a premium member! Enjoy these exclusive features:</p>
          <ul>
            <li>Advanced meal planning</li>
            <li>Nutritional information for all recipes</li>
            <li>Ad-free experience</li>
            <li>Priority customer support</li>
          </ul>
        </div>
      ) : (
        <div>
          <p>Upgrade to Premium to unlock exclusive features:</p>
          <ul>
            <li>Advanced meal planning</li>
            <li>Nutritional information for all recipes</li>
            <li>Ad-free experience</li>
            <li>Priority customer support</li>
          </ul>
          <button className="btn btn-primary mt-3" onClick={handleUpgrade}>
            Upgrade to Premium
          </button>
          {upgradeError && <p className="text-danger mt-2">{upgradeError}</p>}
        </div>
      )}
    </div>
  );
};