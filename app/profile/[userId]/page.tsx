'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe, User } from '../../types';
import { ProfileHeader, UserRecipes, UserProfileSkeleton } from '../../Components/profile';

export default function UserProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserRecipes();
      if (currentUser) {
        checkFollowStatus();
        fetchFollowCounts();
      }
    }
  }, [userId, currentUser]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const response = await fetch(`/api/recipes?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user recipes');
      const data = await response.json();
      setRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching user recipes:', error);
      setError('Failed to load user recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await fetch(`/api/followUsers?followingId=${userId}`);
      if (!response.ok) throw new Error('Failed to check follow status');
      const data = await response.json();
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await fetch(`/api/followCounts/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch follow counts');
      const data = await response.json();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/followUsers', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });
      
      if (!response.ok) throw new Error('Failed to update follow status');
      
      setIsFollowing(!isFollowing);
      fetchFollowCounts();
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  if (isLoading) return <UserProfileSkeleton />;
  if (error) return <div className="alert-error p-4 rounded-lg">{error}</div>;
  if (!profile) return <div className="alert-error p-4 rounded-lg">User not found</div>;

  return (
    <div className="page-container space-y-8">
      <ProfileHeader
        profile={profile}
        recipeCount={recipes.length}
        followersCount={followersCount}
        followingCount={followingCount}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
      />
      <UserRecipes recipes={recipes} />
    </div>
  );
}