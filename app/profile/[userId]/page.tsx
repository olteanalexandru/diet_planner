'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ProfileHeader } from '@/app/Components/profile/ProfileHeader';
import { ProfileTabs } from '@/app/Components/profile/ProfileTabs';
import { ProfileSkeleton } from '@/app/Components/profile/ProfileSkeleton';
import { Recipe, User } from '@/app/types';

type TabType = 'recipes' | 'favorites' | 'activity';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    recipesCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [activeTab, setActiveTab] = useState<TabType>('recipes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch profile data
        const profileResponse = await fetch(`/api/users/${userId}`);
        if (!profileResponse.ok) throw new Error('Failed to fetch profile');
        const profileData = await profileResponse.json();
        setProfile(profileData.user);

        // Fetch recipes
        const recipesResponse = await fetch(`/api/recipes?userId=${userId}`);
        if (!recipesResponse.ok) throw new Error('Failed to fetch recipes');
        const recipesData = await recipesResponse.json();
        setRecipes(recipesData.recipes);

        // Fetch follow status if logged in
        if (currentUser?.sub && userId !== currentUser.sub) {
          const followResponse = await fetch(`/api/followUsers?followingId=${userId}`);
          if (followResponse.ok) {
            const followData = await followResponse.json();
            setIsFollowing(followData.isFollowing);
          }
        }

        // Fetch stats
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, currentUser]);

  const handleFollowToggle = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch('/api/followUsers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (!response.ok) throw new Error('Failed to update follow status');

      setIsFollowing(!isFollowing);
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (isFollowing ? -1 : 1),
      }));
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (loading) return <ProfileSkeleton />;
  
  if (error) {
    return (
      <div className="flex-center min-h-[60vh] flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-cyber-outline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-center min-h-[60vh]">
        <p className="text-gray-400">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="page-container space-y-8">
      <ProfileHeader
        profile={profile}
        stats={stats}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />

      <ProfileTabs
        recipes={recipes}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}