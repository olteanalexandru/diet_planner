'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Filter, Users, TrendingUp, ChefHat, Flame, Loader2 } from 'lucide-react';
import { ActivityCard } from '../Components/social/ActivityCard';
import { SuggestedUsers } from '../Components/social/SuggestedUsers';
import { TrendingTopics } from '../Components/social/TrendingTopics';
import { useSocialFeed } from '../context/SocialFeedContext';
import { ActivityType, ActivityFilter, TimeFrame } from '../types/social';

const SocialFeed = () => {
  const { ref, inView } = useInView();
  const pageRef = useRef(1);
  const {
    activities,
    isLoading,
    error,
    filters,
    hasMore,
    fetchActivities,
    setFilters
  } = useSocialFeed();

  // Activity type options with icons and labels
  const activityTypes: Array<{ value: ActivityType; label: string; icon: React.ReactNode }> = [
    { value: 'recipe_created', label: 'Recipes', icon: <ChefHat size={16} /> },
    { value: 'recipe_liked', label: 'Likes', icon: <Flame size={16} /> },
    { value: 'started_following', label: 'Following', icon: <Users size={16} /> },
    { value: 'achievement_earned', label: 'Achievements', icon: <TrendingUp size={16} /> }
  ];

  const timeframes: Array<{ value: TimeFrame; label: string }> = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  useEffect(() => {
    fetchActivities(1);
    pageRef.current = 1;
  }, [filters]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      pageRef.current += 1;
      fetchActivities(pageRef.current);
    }
  }, [inView, hasMore, isLoading]);

  const handleFilterChange = useCallback((key: keyof ActivityFilter, value: any) => {
    setFilters((prevFilters: ActivityFilter) => {
      if (key === 'type') {
        return {
          ...prevFilters,
          type: value as ActivityType[]
        };
      }
      if (key === 'timeframe') {
        return {
          ...prevFilters,
          timeframe: value as TimeFrame
        };
      }
      if (key === 'following') {
        return {
          ...prevFilters,
          following: value as boolean
        };
      }
      return prevFilters;
    });
  }, [setFilters]);

  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 space-y-6">
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter size={18} />
              Filters
            </h2>
            
            <div className="space-y-6">
              {/* Activity Types */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Activity Types
                </label>
                <div className="space-y-2">
                  {activityTypes.map(type => (
                    <label key={type.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="form-checkbox text-cyber-primary rounded border-space-600"
                        checked={filters.type?.includes(type.value) || false}
                        onChange={(e) => {
                          const currentTypes = filters.type || [];
                          const newTypes = e.target.checked
                            ? [...currentTypes, type.value]
                            : currentTypes.filter(t => t !== type.value);
                          handleFilterChange('type', newTypes);
                        }}
                      />
                      <span className="flex items-center gap-2 text-sm text-gray-300">
                        {type.icon}
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Time Period
                </label>
                <select
                  className="form-select w-full bg-space-800 border-space-600 rounded-lg text-gray-300"
                  value={filters.timeframe || 'all'}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value as TimeFrame)}
                >
                  {timeframes.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Following Filter */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="form-checkbox text-cyber-primary rounded border-space-600"
                    checked={filters.following || false}
                    onChange={(e) => handleFilterChange('following', e.target.checked)}
                  />
                  <span className="text-sm text-gray-300">Following Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <TrendingTopics />

          {/* Suggested Users */}
          <SuggestedUsers />
        </aside>

        {/* Main Feed */}
        <main className="flex-grow space-y-6">
          {activities.map((group) => (
            <div key={group.date} className="space-y-4">
              <div className="sticky top-0 z-10 bg-space-800/80 backdrop-blur-sm py-2">
                <h3 className="text-sm font-medium text-gray-400">
                  {group.date}
                </h3>
              </div>
              <div className="space-y-4">
                {group.activities.map((activity) => (
                  <ActivityCard 
                    key={activity.id} 
                    activity={activity} 
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Loading & Pagination */}
          <div ref={ref} className="py-4 text-center">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading more activities...</span>
              </div>
            )}
            {!hasMore && activities.length > 0 && (
              <p className="text-gray-400">No more activities to load</p>
            )}
            {!isLoading && activities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-lg text-gray-400">No activities found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or follow more users to see their activities
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;