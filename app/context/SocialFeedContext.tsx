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
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActivities = useCallback(async (page: number = 1) => {
    // Don't fetch if we're already loading or if there's no more data
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
      
      const data = await response.json();
      
      // Update activities based on page number
      setActivities(prev => page === 1 ? data.activities : [...prev, ...data.activities]);
      setHasMore(data.hasMore);
      setCurrentPage(page);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      // Reset hasMore if there's an error
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoading, hasMore]);

  // Reset everything when filters change
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
        // ... rest of your context values
      }}
    >
      {children}
    </SocialFeedContext.Provider>
  );
};

export { SocialFeedContext };