'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ProfileHeader } from '../../Components/profile/ProfileHeader';
import { ProfileTabs } from '../../Components/profile/ProfileTabs';
import { ProfileSkeleton } from '../../Components/profile/ProfileSkeleton';
import { ProfileProvider, useProfile } from '../../context/ProfileContext';

type TabType = 'recipes' | 'favorites' | 'activity';

function ProfileContent() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const {
    profileData: profile,
    stats,
    isFollowing,
    loading,
    error,
    userRecipes: recipes,
    toggleFollow,
    activeTab,
    setActiveTab,
    fetchProfileData
  } = useProfile();

  React.useEffect(() => {
    if (userId) {
      fetchProfileData(userId as string);
    }
  }, [userId, fetchProfileData]);

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

  const handleFollowToggle = async () => {
    try {
      await toggleFollow(userId as string);
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

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
        onTabChange={handleTabChange}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <ProfileContent />
    </ProfileProvider>
  );
}
