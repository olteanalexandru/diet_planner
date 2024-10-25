import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User as UserType } from '../../types';
import { ChefHat, Users } from 'lucide-react';
import { FollowButton } from '../FollowButton';

interface UserPopoverProps {
  userId: string;
}

export const UserPopover: React.FC<UserPopoverProps> = ({ userId }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="w-72 bg-space-800 rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-cyber-primary/10 flex items-center justify-center">
          <span className="text-2xl">{user.name?.[0].toUpperCase()}</span>
        </div>
        
        <div className="flex-grow">
          <Link
            href={`/profile/${user.id}`}
            className="font-semibold hover:text-cyber-primary"
          >
            {user.name}
          </Link>
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <ChefHat size={14} />
              <span>{user._count?.recipes || 0} recipes</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{user._count?.followers || 0} followers</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <FollowButton userId={user.id} />
      </div>
    </div>
  );
};