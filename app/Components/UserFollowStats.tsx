import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface UserFollowStatsProps {
  userId: string;
}

export const UserFollowStats: React.FC<UserFollowStatsProps> = ({ userId }) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowStats = async () => {
      try {
        const response = await fetch(`/api/followCounts?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch follow counts');
        const data = await response.json();
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
      } catch (error) {
        console.error('Error fetching follow counts:', error);
        setError('Failed to load follow counts');
      }
    };

    fetchFollowStats();
  }, [userId]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Users size={16} />
        <span>{followersCount} followers</span>
      </div>
      <div className="flex items-center gap-2 text-gray-400">
        <Users size={16} />
        <span>{followingCount} following</span>
      </div>
    </div>
  );
};
