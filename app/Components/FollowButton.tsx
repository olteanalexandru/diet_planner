// app/Components/FollowButton.tsx

import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, initialIsFollowing }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/followUsers', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
      } else {
        console.error('Failed to update follow status');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.sub === userId) return null;

  return (
    <button
      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};