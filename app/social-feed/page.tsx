'use client'
import React, { useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Filter, Users, TrendingUp, ChefHat, Flame, Loader2, Clock } from 'lucide-react';
import { ActivityCard } from '../Components/social/ActivityCard';
import { SuggestedUsers } from '../Components/social/SuggestedUsers';
import { TrendingTopics } from '../Components/social/TrendingTopics';
import { useSocialFeed } from '../context/SocialFeedContext';
import { useLanguage } from '../context/LanguageContext';


const SocialFeed = () => {
  const { t } = useLanguage();
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

  // Activity type options with icons and labels
  const activityTypes: Array<{ value: string; label: string; icon: React.ReactNode }> = [
    { value: 'all', label: t('socialFeed.filterAll'), icon: <Filter size={16} /> },
    { value: 'recipe_created', label: t('socialFeed.filterRecipes'), icon: <ChefHat size={16} /> },
    { value: 'recipe_liked', label: t('socialFeed.filterLikes'), icon: <Flame size={16} /> },
    { value: 'started_following', label: t('socialFeed.filterFollowing'), icon: <Users size={16} /> },
    { value: 'achievement_earned', label: t('socialFeed.filterAchievements'), icon: <TrendingUp size={16} /> }
  ];

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
  }, [inView, hasMore, activities.length, isLoading, fetchActivities]);

  const handleCategoryChange = (category: string) => {
    setFilters({ category });
  };

  const handleSortChange = (sortBy: 'trending' | 'latest') => {
    setFilters({ sortBy });
  };

  return (
    <div className="page-container">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 space-y-6">
          <div className="card-cyber p-4">
            <h2 className="text-lg font-semibold mb-4">{t('feed.categories')}</h2>
            <div className="space-y-1">
              {activityTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleCategoryChange(type.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    filters.category === type.value 
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
            <h2 className="text-lg font-semibold mb-4">{t('socialFeed.sortBy')}</h2>
            <div className="space-y-1">
              <button
                onClick={() => handleSortChange('trending')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  filters.sortBy === 'trending'
                    ? 'bg-cyber-primary text-space-900'
                    : 'hover:bg-space-700'
                }`}
              >
                <TrendingUp size={16} />
                {t('feed.sortTrending')}
              </button>
              <button
                onClick={() => handleSortChange('latest')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  filters.sortBy === 'latest'
                    ? 'bg-cyber-primary text-space-900'
                    : 'hover:bg-space-700'
                }`}
              >
                <Clock size={16} />
                {t('feed.sortLatest')}
              </button>
            </div>
          </div>

          {/* Suggested Users */}
          <div className="hidden lg:block">
            <SuggestedUsers />
          </div>

          {/* Trending Topics */}
          <div className="hidden lg:block">
            <TrendingTopics />
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-grow space-y-6">
          {activities.length === 0 && !isLoading ? (
            <div className="card-cyber p-6 text-center">
              <p className="text-gray-400 mb-4">{t('socialFeed.emptyTitle')}</p>
              <p className="text-sm text-gray-500">
                {t('socialFeed.emptyHint')}
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
                    <span>{t('socialFeed.loadingMore')}</span>
                  </div>
                )}
                {!hasMore && activities.length > 0 && (
                  <p className="text-gray-400">{t('socialFeed.noMore')}</p>
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
