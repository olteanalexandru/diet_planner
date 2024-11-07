'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import { ActivityGroup, ActivityFilter, SocialContextType, SocialFeedResponse } from '../types/social';
import { socialFeedService } from '../services/socialFeedService';

const SocialFeedContext = createContext<SocialContextType | undefined>(undefined);

export const useSocialFeed = () => {
  const context = useContext(SocialFeedContext);
  if (!context) {
    throw new Error('useSocialFeed must be used within a SocialFeedProvider');
  }
  return context;
};

interface SocialFeedProviderProps {
  children: ReactNode;
}

export const SocialFeedProvider = ({ children }: SocialFeedProviderProps) => {
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilter>({});
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActivities = useCallback(async (page: number = 1) => {
    if (isLoading || (page > 1 && !hasMore)) return;

    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        ...(filters.type && { type: filters.type.join(',') }),
        ...(filters.timeframe && { timeframe: filters.timeframe }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.following !== undefined && { following: filters.following.toString() })
      });

      const response = await fetch(`/api/socialFeed?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      
      const data = await response.json() as SocialFeedResponse;
      
      setActivities((prev: ActivityGroup[]) => page === 1 ? data.activities : [...prev, ...data.activities]);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoading, hasMore]);

  const likeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await socialFeedService.likeActivity(activityId);
      if (response.status === 200) {
        setActivities((prev: ActivityGroup[]) => 
          prev.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      hasLiked: true,
                      likes: activity.interactions.likes + 1
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to like activity');
    }
  }, []);

  const unlikeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await socialFeedService.unlikeActivity(activityId);
      if (response.status === 200) {
        setActivities((prev: ActivityGroup[]) => 
          prev.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      hasLiked: false,
                      likes: activity.interactions.likes - 1
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to unlike activity');
    }
  }, []);

  const addComment = useCallback(async (activityId: string, content: string) => {
    try {
      const response = await socialFeedService.commentOnActivity(activityId, content);
      if (response.status === 200 && response.data) {
        setActivities((prev: ActivityGroup[]) => 
          prev.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      comments: activity.interactions.comments + 1
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to add comment');
    }
  }, []);

  const shareActivity = useCallback(async (recipeId: string) => {
    try {
      const response = await socialFeedService.shareRecipe(recipeId);
      if (response.status === 200 && response.data) {
        // Refresh the feed to show the new shared activity
        fetchActivities(1);
      }
    } catch (error) {
      setError('Failed to share recipe');
    }
  }, [fetchActivities]);

  const handleSetFilters = useCallback((newFilters: ActivityFilter) => {
    setFilters(newFilters);
    setActivities([]);
    setHasMore(true);
    setCurrentPage(1);
  }, []);

  return (
    <SocialFeedContext.Provider
      value={{
        activities,
        isLoading,
        error,
        filters,
        hasMore,
        fetchActivities,
        setFilters: handleSetFilters,
        likeActivity,
        unlikeActivity,
        addComment,
        shareActivity
      }}
    >
      {children}
    </SocialFeedContext.Provider>
  );
};

export { SocialFeedContext };
