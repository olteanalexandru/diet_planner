'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Recipe } from '../types';
import { recipeService } from '../services/recipeService';

type SortOption = 'trending' | 'latest';

interface RecipeFeedContextType {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  category: string;
  sort: SortOption;
  page: number;
  hasMore: boolean;
  trendingTags: { tag: string; count: number }[];
  tagFilter: string | null;
  setCategory: (category: string) => void;
  setSort: (sort: SortOption) => void;
  setTagFilter: (tag: string | null) => void;
  handleLike: (recipeId: string) => Promise<void>;
  handleUnlike: (recipeId: string) => Promise<void>;
  loadMoreRecipes: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
}

const RecipeFeedContext = createContext<RecipeFeedContextType | undefined>(undefined);

export function RecipeFeedProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<SortOption>('trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const fetchRecipes = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const data = await recipeService.getFeedRecipes(category, sort, currentPage, tagFilter);
      
      setRecipes(prev => reset ? data.recipes : [...prev, ...data.recipes]);
      setHasMore(data.hasMore);
      
      if (reset) setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (recipeId: string) => {
    try {
      const { isLiked, likes } = await recipeService.likeRecipe(recipeId);
      updateRecipeLikeStatus(recipeId, isLiked, likes);
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleUnlike = async (recipeId: string) => {
    try {
      const { isLiked, likes } = await recipeService.unlikeRecipe(recipeId);
      updateRecipeLikeStatus(recipeId, isLiked, likes);
    } catch (error) {
      console.error('Error unliking recipe:', error);
    }
  };

  const updateRecipeLikeStatus = (recipeId: string, isLiked: boolean, likes: number) => {
    setRecipes(prev => prev.map(r => 
      r.id === recipeId 
        ? { 
            ...r, 
            isLiked,
            _count: {
              ...r._count,
              likes
            }
          }
        : r
    ));
  };

  const loadMoreRecipes = async () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      await fetchRecipes();
    }
  };

  const refreshRecipes = () => fetchRecipes(true);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const tags = await recipeService.getTrendingTags();
        setTrendingTags(tags);
      } catch (err) {
        console.error('Failed to fetch trending tags:', err);
      }
    };
    fetchTrendingTags();
  }, []);

  useEffect(() => {
    fetchRecipes(true);
  }, [category, sort, tagFilter]);

  const value = {
    recipes,
    loading,
    error,
    category,
    sort,
    page,
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
  };

  return (
    <RecipeFeedContext.Provider value={value}>
      {children}
    </RecipeFeedContext.Provider>
  );
}

export const useRecipeFeed = () => {
  const context = useContext(RecipeFeedContext);
  if (context === undefined) {
    throw new Error('useRecipeFeed must be used within a RecipeFeedProvider');
  }
  return context;
};
