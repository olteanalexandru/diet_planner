import React from 'react';
import { User} from '../../types';
import { UserStatsCard } from './UserStats';
import { FollowButton } from '../FollowButton';
import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Edit2,  Users, BookOpen } from 'lucide-react';

interface ProfileHeaderProps {
  profile: User;
  recipeCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowToggle: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  recipeCount,
  followersCount,
  followingCount,
  isFollowing,
  onFollowToggle,
}) => {
  const { user } = useUser();
  const isOwnProfile = user?.sub === profile.id;

  return (
    <div className="card-cyber p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-cyber-primary/10 flex items-center justify-center">
            <span className="text-3xl">
              {profile.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{profile.name}</h1>
              <p className="text-gray-400">Member since {formatDistance(new Date(profile.createdAt), new Date(), { addSuffix: true })}</p>
            </div>
            {!isOwnProfile && <FollowButton userId={profile.id} isFollowing={isFollowing} onToggle={onFollowToggle} />}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <UserStatsCard icon={<BookOpen />} label="Recipes" value={recipeCount} />
            <UserStatsCard icon={<Users />} label="Followers" value={followersCount} />
            <UserStatsCard icon={<Users />} label="Following" value={followingCount} />
          </div>

          {profile.bio && (
            <p className="mt-4 text-gray-300">{profile.bio}</p>
          )}

          {isOwnProfile && (
            <Link 
              href="/settings/profile" 
              className="mt-4 btn-cyber-outline inline-flex items-center"
            >
              <Edit2 size={16} className="mr-2" />
              Edit Profile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};





