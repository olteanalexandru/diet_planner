'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { userService } from '../services/userService';
import { recipeService } from '../services/recipeService';

interface DashboardContextType {
  customRecipes: Recipe[];
  favorites: Recipe[];
  followersCount: number;
  followingCount: number;
  error: string | null;
  refreshCustomRecipes: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshFollowCounts: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomRecipes = async () => {
    try {
      if (!user?.sub) {
        throw new Error('No user ID available');
      }
      const data = await recipeService.getUserRecipes(user.sub);
      setCustomRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching custom recipes:', error);
      setError(error instanceof Error ? error.message : 'Failed to load custom recipes');
    }
  };

  const fetchFavorites = async () => {
    try {
      const data = await userService.getFavorites();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const data = await userService.getFollowCounts();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setError('Failed to load social stats');
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomRecipes();
      fetchFavorites();
      fetchFollowCounts();
    }
  }, [user]);

  const value = {
    customRecipes,
    favorites,
    followersCount,
    followingCount,
    error,
    refreshCustomRecipes: fetchCustomRecipes,
    refreshFavorites: fetchFavorites,
    refreshFollowCounts: fetchFollowCounts
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
