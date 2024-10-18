'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface FollowButtonProps {
  userId: string;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ userId }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/followUsers?followingId=${userId}`);
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
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
      onClick={handleFollowToggle}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};