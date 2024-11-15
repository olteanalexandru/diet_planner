'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { Recipe } from '../types/recipe';
import { searchService, SearchFilters } from '../services/searchService';
import { ITEMS_PER_PAGE } from '../constants';

interface SearchContextType {
  filters: SearchFilters;
  searchResults: Recipe[];
  isLoading: boolean;
  error: string | null;
  totalResults: number;
  trendingTags: { tag: string; count: number }[];
  updateFilters: (key: keyof SearchFilters, value: any) => void;
  addCustomTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  addIngredient: (ingredient: string) => void;
  removeIngredient: (ingredient: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>({
    title: '',
    tags: [],
    diets: [],
    ingredients: [],
    page: 1,
    limit: ITEMS_PER_PAGE
  });

  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);

  const debouncedSearch = debounce(async (searchFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const { recipes, total } = await searchService.searchRecipes(searchFilters);
      setSearchResults(recipes);
      setTotalResults(total);
    } catch (err) {
      setError('Failed to search recipes. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(filters);
    return () => debouncedSearch.cancel();
  }, [filters]);

  useEffect(() => {
    const fetchTrendingTags = async () => {
      try {
        const { tags } = await searchService.getTrendingTags();
        setTrendingTags(tags);
      } catch (err) {
        console.error('Failed to fetch trending tags:', err);
      }
    };
    fetchTrendingTags();
  }, []);

  const updateFilters = (
    key: keyof SearchFilters,
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? Number(value) : 1
    }));
  };

  const addCustomTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !filters.tags.includes(trimmedTag)) {
      updateFilters('tags', [...filters.tags, trimmedTag]);
    }
  };

  const removeTag = (tag: string) => {
    updateFilters('tags', filters.tags.filter(t => t !== tag));
  };

  const addIngredient = (ingredient: string) => {
    const trimmedIngredient = ingredient.trim();
    if (trimmedIngredient && !filters.ingredients.includes(trimmedIngredient)) {
      updateFilters('ingredients', [...filters.ingredients, trimmedIngredient]);
    }
  };

  const removeIngredient = (ingredient: string) => {
    updateFilters('ingredients', filters.ingredients.filter(i => i !== ingredient));
  };

  const value = {
    filters,
    searchResults,
    isLoading,
    error,
    totalResults,
    trendingTags,
    updateFilters,
    addCustomTag,
    removeTag,
    addIngredient,
    removeIngredient,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
