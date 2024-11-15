'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { DIET_OPTIONS, TAG_OPTIONS } from '../constants';
import { SearchProvider, useSearch } from '../context/SearchContext';

function SearchContent() {
  const router = useRouter();
  const {
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
  } = useSearch();

  const [customTag, setCustomTag] = useState('');
  const [ingredient, setIngredient] = useState('');

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTag.trim()) {
      addCustomTag(customTag);
      setCustomTag('');
    }
  };

  const handleAddIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && ingredient.trim()) {
      addIngredient(ingredient);
      setIngredient('');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-[rgb(var(--foreground))]">Search Recipes</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg glass p-4">
            <h2 className="font-semibold mb-4 text-[rgb(var(--foreground))]">Filters</h2>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                className="input-cyber w-full"
                value={filters.title}
                onChange={(e) => updateFilters('title', e.target.value)}
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
                        updateFilters('diets', newDiets);
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
                        updateFilters('tags', newTags);
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
                      updateFilters('tags', newTags);
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filters.tags.includes(tag)
                        ? 'bg-[rgb(var(--accent))] text-[rgb(var(--background))]'
                        : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]'
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
                      onClick={() => removeTag(tag)}
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
                      onClick={() => removeIngredient(ingredient)}
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
            <div className="alert alert-error">
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
                    className="cursor-pointer card-cyber overflow-hidden hover:shadow-lg transition-shadow"
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
                      <h3 className="font-semibold text-lg mb-2 text-[rgb(var(--foreground))]">
                        {recipe.title}
                      </h3>
                      <p className="text-[rgb(var(--muted))] text-sm mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
                      <div className="text-[rgb(var(--muted))] text-sm mb-2">
                        <strong className="text-[rgb(var(--foreground))]">Ingredients:</strong> 
                        {recipe.ingredients.join(', ')}
                      </div>
                      <div className="flex justify-between items-center text-sm text-[rgb(var(--muted))]">
                        <span>{recipe.cookingTime} mins</span>
                        <span className="capitalize">{recipe.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalResults > filters.limit && (
                <div className="mt-6 flex justify-center">
                  <div className="flex gap-2">
                    {Array.from(
                      { length: Math.ceil(totalResults / filters.limit) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => updateFilters('page', page)}
                        className={`px-3 py-1 rounded ${
                          filters.page === page
                            ? 'bg-[rgb(var(--accent))] text-[rgb(var(--background))]'
                            : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]'
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

export default function SearchPage() {
  return (
    <SearchProvider>
      <SearchContent />
    </SearchProvider>
  );
}
