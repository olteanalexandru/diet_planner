'use client';

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import { Filter, TrendingUp, Users, Loader2 } from 'lucide-react';
import { useSocialFeed } from '../context/SocialFeedContext';
import { ActivityCard } from '../Components/social/ActivityCard';
import { ActivityType, ActivityFilter } from '../types/social';

// Constants
const activityTypes: Array<{ value: ActivityType; label: string }> = [
  { value: 'recipe_created', label: 'Recipe Created' },
  { value: 'recipe_liked', label: 'Recipes Liked' },
  { value: 'comment_added', label: 'Comments' },
  { value: 'started_following', label: 'Following Updates' },
  { value: 'achievement_earned', label: 'Achievements' }
];

const timeframes = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }
];

export default function SocialFeed() {
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

  const handleFilterChange = (filterType: keyof ActivityFilter, value: any) => {
    setFilters({ ...filters, [filterType]: value });
  }
  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-6">
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter size={18} />
              Filters
            </h2>
            
            <div className="space-y-4">
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
                        checked={filters.type?.includes(type.value)}
                        onChange={(e) => {
                          const currentTypes = filters.type || [];
                          if (e.target.checked) {
                            handleFilterChange('type', [...currentTypes, type.value]);
                          } else {
                            handleFilterChange('type', currentTypes.filter(t => t !== type.value));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Timeframe
                </label>
                <select
                  className="form-select w-full bg-space-800 border-space-600 rounded-lg text-gray-300"
                  value={filters.timeframe || 'all'}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                >
                  {timeframes.map(time => (
                    <option key={time.value} value={time.value}>
                      {time.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Trending Topics */}
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              Trending
            </h2>
            <div className="space-y-3">
              {['#HealthyEating', '#QuickMeals', '#VeganRecipes'].map(topic => (
                <button
                  key={topic}
                  className="block w-full text-left px-3 py-2 rounded-lg hover:bg-space-700 text-gray-300 hover:text-cyber-primary transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Follows */}
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users size={18} />
              Suggested Follows
            </h2>
            <div className="space-y-4">
              <SuggestedUser />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow space-y-6">
          {/* Activity Feed */}
          {activities.map((group, index) => (
            <div key={group.date} className="space-y-4">
              <div className="sticky top-0 z-10 bg-space-800/80 backdrop-blur-sm py-2">
                <h3 className="text-sm font-medium text-gray-400">
                  {group.date}
                </h3>
              </div>
              <div className="space-y-4">
                {group.activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          ))}

          {/* Loading & Infinite Scroll */}
          <div ref={ref} className="py-4 text-center">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading more activities...
              </div>
            )}
            {!hasMore && (
              <p className="text-gray-400">No more activities to load</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-error fixed bottom-4 right-4 p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

// Suggested User Component
const SuggestedUser = () => (
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-full bg-space-700 flex items-center justify-center">
      <span className="text-lg">👤</span>
    </div>
    <div className="flex-grow min-w-0">
      <h3 className="text-sm font-medium text-gray-300 truncate">John Doe</h3>
      <p className="text-xs text-gray-400">Popular Chef • 5k followers</p>
    </div>
    <button className="btn-cyber-outline py-1 px-3 text-sm">
      Follow
    </button>
  </div>
);