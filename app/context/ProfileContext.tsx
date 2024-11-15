'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/user';
import { Recipe } from '../types/recipe';
import { userService } from '../services/userService';

type TabType = 'recipes' | 'favorites' | 'activity';

interface ProfileContextType {
  profileData: User | null;
  userRecipes: Recipe[];
  stats: {
    recipesCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  loading: boolean;
  error: string | null;
  fetchProfileData: (userId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  setActiveTab: (tab: TabType) => void;
  activeTab: TabType;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profileData, setProfileData] = useState<User | null>(null);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [stats, setStats] = useState({
    recipesCount: 0,
    followersCount: 0,
    followingCount: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('recipes');

  const fetchProfileData = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile data using userService
      const profileResponse = await userService.getUserProfile(userId);
      setProfileData(profileResponse.user);

      // Fetch user stats
      const statsResponse = await userService.getUserStats(userId);
      setStats({
        recipesCount: statsResponse.recipesCount,
        followersCount: statsResponse.followersCount,
        followingCount: statsResponse.followingCount,
      });

      // Fetch recipes
      const recipesResponse = await fetch(`/api/recipes?userId=${userId}`);
      if (!recipesResponse.ok) throw new Error('Failed to fetch recipes');
      const recipesData = await recipesResponse.json();
      setUserRecipes(recipesData.recipes);

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async (userId: string) => {
    try {
      if (isFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      
      setIsFollowing(!isFollowing);
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (isFollowing ? -1 : 1),
      }));
    } catch (error) {
      console.error('Error updating follow status:', error);
      throw error;
    }
  };

  const value = {
    profileData,
    userRecipes,
    stats,
    isFollowing,
    loading,
    error,
    fetchProfileData,
    toggleFollow,
    setActiveTab,
    activeTab,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
