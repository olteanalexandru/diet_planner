import React from 'react';
import { Users } from 'lucide-react';

interface UserFollowStatsProps {
  followersCount: number;
  followingCount: number;
}

export const UserFollowStats: React.FC<UserFollowStatsProps> = ({
  followersCount,
  followingCount,
}) => {
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