'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import {  TrendingUp, Clock, ArrowUp } from 'lucide-react';
import { RecipeGridSkeleton } from '../Components/recipes/RecipeSkeleton';
import { FeedRecipeCard } from '../Components/recipes/FeedRecipeCard';
import { useRecipeFeed, RecipeFeedProvider } from '../context/RecipeFeedContext';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'quick', name: 'Quick & Easy', icon: '⚡' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥗' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'healthy', name: 'Healthy', icon: '💪' },
  { id: 'budget', name: 'Budget', icon: '💰' },
] as const;

function RecipeFeedContent() {
  const { 
    recipes, 
    loading, 
    error, 
    category, 
    sort, 
    hasMore,
    trendingTags,
    tagFilter,
    setCategory,
    setSort,
    setTagFilter,
    handleLike,
    handleUnlike,
    loadMoreRecipes,
    refreshRecipes
  } = useRecipeFeed();

  const { ref, inView } = useInView();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMoreRecipes();
    }
  }, [inView, hasMore, loading, loadMoreRecipes]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    setTagFilter(tagFilter === tag ? null : tag);
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header - lower z-index */}
      <div className="sticky top-0 z-10 bg-space-800/80 backdrop-blur-lg border-b border-space-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            {/* Sort Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setSort('trending')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  sort === 'trending' ? 'bg-cyber-primary text-space-900' : 'hover:bg-space-700'
                }`}
              >
                <TrendingUp size={16} />
                Trending
              </button>
              <button
                onClick={() => setSort('latest')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  sort === 'latest' ? 'bg-cyber-primary text-space-900' : 'hover:bg-space-700'
                }`}
              >
                <Clock size={16} />
                Latest
              </button>
            </div>

            {/* Categories Dropdown - Mobile */}
            <div className="md:hidden ml-auto">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-space-800 border border-space-600 rounded-lg px-3 py-2"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-64 space-y-6">
            {/* Categories */}
            <div className="card-cyber p-4">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      category === cat.id 
                        ? 'bg-cyber-primary text-space-900' 
                        : 'hover:bg-space-700'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Tags */}
            <div className="card-cyber p-4">
              <h2 className="text-lg font-semibold mb-4">Trending Tags</h2>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      tagFilter === tag 
                        ? 'bg-cyber-primary text-space-900' 
                        : 'bg-space-700 hover:bg-space-600'
                    }`}
                  >
                    #{tag}
                    <span className="ml-2 text-xs text-gray-400">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {error ? (
              <div className="card-cyber p-6 text-center">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={refreshRecipes}
                  className="btn-cyber mt-4"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {recipes.map((recipe) => (
                  <FeedRecipeCard 
                    key={recipe.id} 
                    recipe={recipe}
                    onLike={handleLike}
                    onUnlike={handleUnlike}
                  />
                ))}
                
                {/* Loading State */}
                {loading && <RecipeGridSkeleton />}
                
                {/* Infinite Scroll Trigger */}
                <div ref={ref} className="h-10" />
                
                {/* No More Content */}
                {!hasMore && recipes.length > 0 && (
                  <div className="text-center py-8 text-gray-400">
                    You've reached the end!
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-cyber-primary text-space-900 shadow-lg hover:bg-cyber-accent transition-colors z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </div>
  );
}

export default function RecipeFeedPage() {
  return (
    <RecipeFeedProvider>
      <RecipeFeedContent />
    </RecipeFeedProvider>
  );
}
