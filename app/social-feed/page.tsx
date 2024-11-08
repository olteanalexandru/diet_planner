'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Filter, Users, TrendingUp, ChefHat, Flame, Loader2, Clock } from 'lucide-react';
import { ActivityCard } from '../Components/social/ActivityCard';
import { SuggestedUsers } from '../Components/social/SuggestedUsers';
import { TrendingTopics } from '../Components/social/TrendingTopics';
import { useSocialFeed } from '../context/SocialFeedContext';
import { ActivityType, ActivityFilter, TimeFrame } from '../types/social';

const SocialFeed = () => {
  // Add loading ref to prevent multiple calls
  const loadingRef = useRef(false);
  const { ref, inView } = useInView({
    threshold: 0,
    // Add rootMargin to trigger fetch before reaching the bottom
    rootMargin: '100px',
  });

  const {
    activities,
    isLoading,
    error,
    filters,
    hasMore,
    fetchActivities,
    setFilters
  } = useSocialFeed();

  // State for category and sort options
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<string>('trending');

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

  // Reset page when filters change
  useEffect(() => {
    fetchActivities(1);
  }, [filters, category, sort]);

  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = async () => {
      // Prevent multiple calls while loading
      if (loadingRef.current || !hasMore || !inView || isLoading) return;

      try {
        loadingRef.current = true;
        await fetchActivities(Math.ceil(activities.length / 10) + 1);
      } finally {
        loadingRef.current = false;
      }
    };

    handleScroll();
  }, [inView, hasMore, activities.length, isLoading]);

  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 space-y-6">
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="space-y-1">
              {activityTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setCategory(type.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    category === type.value 
                      ? 'bg-cyber-primary text-space-900' 
                      : 'hover:bg-space-700'
                  }`}
                >
                  {type.icon}
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4">Sort By</h2>
            <div className="space-y-1">
              <button
                onClick={() => setSort('trending')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  sort === 'trending' 
                    ? 'bg-cyber-primary text-space-900' 
                    : 'hover:bg-space-700'
                }`}
              >
                <TrendingUp size={16} />
                Trending
              </button>
              <button
                onClick={() => setSort('latest')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  sort === 'latest' 
                    ? 'bg-cyber-primary text-space-900' 
                    : 'hover:bg-space-700'
                }`}
              >
                <Clock size={16} />
                Latest
              </button>
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-grow space-y-6">
          {activities.length === 0 && !isLoading ? (
            <div className="card-cyber p-6 text-center">
              <p className="text-gray-400 mb-4">No activities to show</p>
              <p className="text-sm text-gray-500">
                Try adjusting your filters or follow more users to see their activities
              </p>
            </div>
          ) : (
            <>
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
              <div 
                ref={ref} 
                className="py-4 text-center"
              >
                {isLoading && (
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading more activities...</span>
                  </div>
                )}
                {!hasMore && activities.length > 0 && (
                  <p className="text-gray-400">No more activities to load</p>
                )}
              </div>
            </>
          )}
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