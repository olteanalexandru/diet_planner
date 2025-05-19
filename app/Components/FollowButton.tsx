import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { FollowButtonProps } from '../types';

export const FollowButton: React.FC<FollowButtonProps> = ({ userId, onFollowToggle }) => {
  const { user } = useUser();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && userId) {
      checkFollowStatus();
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/followUsers?followingId=${userId}`);
      if (!response.ok) throw new Error('Failed to check follow status');
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
      setError('Failed to check follow status');
    }
  };

  const handleFollowToggle = async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/followUsers', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update follow status');
      }

      const newFollowStatus = !isFollowing;
      setIsFollowing(newFollowStatus);

      if (onFollowToggle) {
        onFollowToggle(newFollowStatus);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.sub === userId) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`btn-cyber-outline flex items-center justify-center gap-2 min-w-[120px] ${
          isFollowing ? 'hover:bg-red-500/10 hover:border-red-500 hover:text-red-500' : ''
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserMinus size={16} />
            Unfollow
          </>
        ) : (
          <>
            <UserPlus size={16} />
            Follow
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
};
