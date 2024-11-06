import { useState, useCallback } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';

export const useUser = (initialUserId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUserProfile(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setUserData(response.data.user);
        return response.data.user;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, data: Partial<User>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.updateUserProfile(userId, data);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setUserData(response.data);
        return response.data;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFollow = useCallback(async (userId: string, isFollowing: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = isFollowing
        ? await userService.unfollowUser(userId)
        : await userService.followUser(userId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle follow');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserStats = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUserStats(userId);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // If initialUserId is provided, fetch the user data on mount
  useState(() => {
    if (initialUserId) {
      fetchUserProfile(initialUserId);
    }
  });

  return {
    loading,
    error,
    userData,
    fetchUserProfile,
    updateProfile,
    toggleFollow,
    fetchUserStats,
  };
};
