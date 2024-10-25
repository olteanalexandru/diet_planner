
import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { CalendarDays, Globe, MapPin } from 'lucide-react';
import { FollowButton } from '../FollowButton';
import Link from 'next/link';
import { User } from '@/app/types';
import { formatDistance } from 'date-fns';

interface ProfileHeaderProps {
  profile: User;
  stats: {
    recipesCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  onFollowToggle: () => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  stats,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useUser();
  const isOwnProfile = user?.sub === profile.id;

  // Format join date safely
  const formatJoinDate = () => {
    try {
      if (!profile.createdAt) return 'Recently joined';
      
      const date = new Date(profile.createdAt);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Recently joined';
      
      return `Joined ${formatDistance(date, new Date(), { addSuffix: true })}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently joined';
    }
  };

  return (
    <div className="card-cyber">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-cyber-primary/10 flex items-center justify-center">
                <span className="text-4xl font-medium text-cyber-primary">
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-100">
                {profile.name || 'Anonymous User'}
              </h1>
              {profile.email && (
                <p className="text-gray-400 flex items-center gap-2">
                  <Globe size={16} />
                  {profile.email}
                </p>
              )}
              <p className="text-gray-400 flex items-center gap-2">
                <CalendarDays size={16} />
                {formatJoinDate()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            {isOwnProfile ? (
              <Link href="/settings/profile" className="btn-cyber-outline">
                Edit Profile
              </Link>
            ) : (
              <FollowButton userId={profile.id} />
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-space-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-xl">🍳</span>
            </div>
            <div className="text-2xl font-bold text-cyber-primary">
              {stats.recipesCount}
            </div>
            <div className="text-sm text-gray-400">Recipes</div>
          </div>
          
          <div className="bg-space-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-cyber-primary">
              {stats.followersCount}
            </div>
            <div className="text-sm text-gray-400">Followers</div>
          </div>
          
          <div className="bg-space-800 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <span className="text-xl">👤</span>
            </div>
            <div className="text-2xl font-bold text-cyber-primary">
              {stats.followingCount}
            </div>
            <div className="text-sm text-gray-400">Following</div>
          </div>
        </div>
      </div>
    </div>
  );
};