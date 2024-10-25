'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { Filter, Loader2, TrendingUp, Clock, ArrowUp } from 'lucide-react';
import { Recipe } from '../types';
import { RecipeGridSkeleton } from '../Components/recipes/RecipeSkeleton';
import {RecipeCard} from '../Components/recipes/FeedRecipeCard';

type SortOption = 'trending' | 'latest';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🍽️' },
  { id: 'quick', name: 'Quick & Easy', icon: '⚡' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥗' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'healthy', name: 'Healthy', icon: '💪' },
  { id: 'budget', name: 'Budget', icon: '💰' },
] as const;

const RecipeFeed = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
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

  // Fetch recipes
  const fetchRecipes = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await fetch('/api/recipes/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, sort, page: currentPage })
      });

      if (!response.ok) throw new Error('Failed to fetch recipes');
      
      const data = await response.json();
      
      setRecipes(prev => reset ? data.recipes : [...prev, ...data.recipes]);
      setHasMore(data.hasMore);
      
      if (reset) setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending tags
  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const response = await fetch('/api/recipes/trending-tags');
        const data = await response.json();
        setTrendingTags(data.tags);
      } catch (err) {
        console.error('Failed to fetch trending tags:', err);
      }
    };
    fetchTrendingTags();
  }, []);

  // Initial load and category/sort changes
  useEffect(() => {
    fetchRecipes(true);
  }, [category, sort]);

  // Infinite scroll
  useEffect(() => {
    if (inView && hasMore && !loading) {
      setPage(prev => prev + 1);
      fetchRecipes();
    }
  }, [inView]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-space-800/80 backdrop-blur-lg border-b border-space-700">
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
                    className="px-3 py-1 rounded-full bg-space-700 hover:bg-space-600 transition-colors"
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
                  onClick={() => fetchRecipes(true)}
                  className="btn-cyber mt-4"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
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
};

export default RecipeFeed;