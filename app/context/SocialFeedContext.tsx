'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ActivityGroup, ActivityFilter, SocialContextType } from '../types/social';

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

export const SocialFeedProvider: React.FC<SocialFeedProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilter>({});
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (page: number = 1) => {
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
      
      const data = await response.json();
      setActivities(prev => page === 1 ? data.activities : [...prev, ...data.activities]);
      setHasMore(data.hasMore);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const likeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await fetch(`/api/socialFeed/${activityId}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to like activity');
      
      const { likes } = await response.json();
      updateActivityLikes(activityId, likes, true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to like activity');
    }
  }, []);

  const unlikeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await fetch(`/api/socialFeed/${activityId}/like`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to unlike activity');
      
      const { likes } = await response.json();
      updateActivityLikes(activityId, likes, false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to unlike activity');
    }
  }, []);

  const addComment = useCallback(async (activityId: string, content: string) => {
    try {
      const response = await fetch(`/api/socialFeed/${activityId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      
      const { comment, commentsCount } = await response.json();
      updateActivityComments(activityId, commentsCount);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    }
  }, []);

  const updateActivityLikes = (activityId: string, likes: number, isLiked: boolean) => {
    setActivities(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        activities: group.activities.map(activity => 
          activity.id === activityId 
            ? {
                ...activity,
                interactions: {
                  ...activity.interactions,
                  likes,
                  hasLiked: isLiked,
                },
              }
            : activity
        ),
      }))
    );
  };

  const updateActivityComments = (activityId: string, comments: number) => {
    setActivities(prevGroups => 
      prevGroups.map(group => ({
        ...group,
        activities: group.activities.map(activity => 
          activity.id === activityId 
            ? {
                ...activity,
                interactions: {
                  ...activity.interactions,
                  comments,
                },
              }
            : activity
        ),
      }))
    );
  };

  return (
    <SocialFeedContext.Provider
      value={{
        activities,
        isLoading,
        error,
        filters,
        hasMore,
        fetchActivities,
        setFilters,
        likeActivity,
        unlikeActivity,
        addComment,
      }}
    >
      {children}
    </SocialFeedContext.Provider>
  );
};

export { SocialFeedContext };