'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { DIET_OPTIONS, TAG_OPTIONS } from '../constants';

interface SearchFilters {
  title: string;
  tags: string[];
  diets: string[];
  ingredients: string[];
  page: number;
  limit: number;
}

interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  cookingTime: number;
  difficulty: string;
  ingredients: string[];
  author: {
    name: string;
    image: string;
  };
}

const ITEMS_PER_PAGE = 12;

export default function SearchRecipePage() {
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
  const router = useRouter();
  const [customTag, setCustomTag] = useState('');
  const [trendingTags, setTrendingTags] = useState<{ tag: string; count: number }[]>([]);
  const [ingredient, setIngredient] = useState('');

  const debouncedSearch = debounce(async (newFilters: SearchFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFilters),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.recipes);
      setTotalResults(data.total);
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
        const response = await fetch('/api/recipes/trending-tags');
        const data = await response.json();
        setTrendingTags(data.tags);
      } catch (err) {
        console.error('Failed to fetch trending tags:', err);
      }
    };
    fetchTrendingTags();
  }, []);

  const handleFilterChange = (
    key: keyof SearchFilters,
    value: string | string[] | number
  ) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim()) {
      const newTag = customTag.trim();
      if (!filters.tags.includes(newTag)) {
        handleFilterChange('tags', [...filters.tags, newTag]);
      }
      setCustomTag('');
    }
  };

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ingredient.trim()) {
      const newIngredient = ingredient.trim();
      if (!filters.ingredients.includes(newIngredient)) {
        handleFilterChange('ingredients', [...filters.ingredients, newIngredient]);
      }
      setIngredient('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Search Recipes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg bg-white p-4 shadow">
            <h2 className="font-semibold mb-4">Filters</h2>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={filters.title}
                onChange={(e) => handleFilterChange('title', e.target.value)}
                placeholder="Search recipes..."
              />
            </div>

            {/* Diet Filters */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Dietary Preferences</h3>
              <div className="space-y-2">
                {DIET_OPTIONS.map(diet => (
                  <label key={diet} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.diets.includes(diet)}
                      onChange={(e) => {
                        const newDiets = e.target.checked
                          ? [...filters.diets, diet]
                          : filters.diets.filter(d => d !== diet);
                        handleFilterChange('diets', newDiets);
                      }}
                      className="mr-2"
                    />
                    {diet}
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Tags</h3>
              <div className="space-y-2">
                {TAG_OPTIONS.map(tag => (
                  <label key={tag} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.tags.includes(tag)}
                      onChange={(e) => {
                        const newTags = e.target.checked
                          ? [...filters.tags, tag]
                          : filters.tags.filter(t => t !== tag);
                        handleFilterChange('tags', newTags);
                      }}
                      className="mr-2"
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            {/* Trending Tags */}
            <div className="mb-4">
              <h3 className="font-medium mb-2">Trending Tags</h3>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => {
                      const newTags = filters.tags.includes(tag)
                        ? filters.tags.filter(t => t !== tag)
                        : [...filters.tags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    #{tag} <span className="ml-2 text-xs text-gray-400">{count}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Tag Input */}
            <div className="mt-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleAddCustomTag}
                placeholder="Add custom tag and press Enter"
                className="w-full p-2 border rounded-md"
              />
            </div>

            {/* Selected Custom Tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.tags
                .filter(tag => !TAG_OPTIONS.includes(tag as typeof TAG_OPTIONS[number]))
                .map(tag => (
                  <div
                    key={tag}
                    className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      onClick={() => handleFilterChange(
                        'tags',
                        filters.tags.filter(t => t !== tag)
                      )}
                      className="hover:text-blue-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>

            {/* Ingredients Filter */}
            <div className="mt-4">
              <h3 className="font-medium mb-2">Ingredients</h3>
              <input
                type="text"
                value={ingredient}
                onChange={(e) => setIngredient(e.target.value)}
                onKeyDown={handleAddIngredient}
                placeholder="Add ingredient and press Enter"
                className="w-full p-2 border rounded-md"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.ingredients.map(ingredient => (
                  <div
                    key={ingredient}
                    className="bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {ingredient}
                    <button
                      onClick={() => handleFilterChange(
                        'ingredients',
                        filters.ingredients.filter(i => i !== ingredient)
                      )}
                      className="hover:text-green-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/recipe/${recipe.id}`)}
                    className="cursor-pointer bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48">
                      <Image
                        src={recipe.imageUrl || '/default-recipe.jpg'}
                        alt={recipe.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{recipe.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
                      <div className="text-gray-600 text-sm mb-2">
                        <strong>Ingredients:</strong> {recipe.ingredients.join(', ')}
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{recipe.cookingTime} mins</span>
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalResults > ITEMS_PER_PAGE && (
                <div className="mt-6 flex justify-center">
                  <div className="flex gap-2">
                    {Array.from(
                      { length: Math.ceil(totalResults / ITEMS_PER_PAGE) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => handleFilterChange('page', page)}
                        className={`px-3 py-1 rounded ${
                          filters.page === page
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}