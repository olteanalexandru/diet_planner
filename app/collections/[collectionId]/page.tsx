'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Collection } from '@/app/types/collection';
import { Recipe } from '@/app/types/recipe';
import { RecipeCard } from '@/app/Components/recipes/RecipeCard';

interface CollectionWithRecipes extends Collection {
  recipes: {
    recipe: Recipe;
  }[];
}

export default function CollectionPage({
  params,
}: {
  params: { collectionId: string };
}) {
  const router = useRouter();
  const { user } = useUser();
  const [collection, setCollection] = useState<CollectionWithRecipes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await fetch(`/api/collections/${params.collectionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Collection not found');
          } else if (response.status === 401) {
            setError('You do not have permission to view this collection');
          } else {
            throw new Error('Failed to fetch collection');
          }
          return;
        }
        const data = await response.json();
        setCollection(data);
      } catch (error) {
        console.error('Error fetching collection:', error);
        setError('Failed to load collection');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [params.collectionId]);

  const handleDeleteCollection = async () => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const response = await fetch(`/api/collections/${params.collectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete collection');

      router.push('/collections');
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  const handleRemoveRecipe = async (recipeId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${params.collectionId}/recipes?recipeId=${recipeId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) throw new Error('Failed to remove recipe');

      setCollection((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          recipes: prev.recipes.filter((r) => r.recipe.id !== recipeId),
        };
      });
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {error || 'Collection not found'}
          </h2>
        </div>
      </div>
    );
  }

  const isOwner = user?.sub === collection.userId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {collection.description}
              </p>
            )}
          </div>
          {isOwner && (
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/collections/${collection.id}/edit`)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteCollection}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{collection.recipes.length} recipes</span>
          <span className="mx-2">•</span>
          <span>{collection.category}</span>
          <span className="mx-2">•</span>
          <span>{collection.isPublic ? 'Public' : 'Private'}</span>
        </div>
      </div>

      {collection.recipes.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-center text-gray-500 dark:text-gray-400">
            No recipes in this collection yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collection.recipes.map(({ recipe }) => (
            <div key={recipe.id} className="relative group">
              <RecipeCard recipe={recipe} />
              {isOwner && (
                <button
                  onClick={() => handleRemoveRecipe(recipe.id)}
                  className="absolute -right-2 -top-2 hidden rounded-full bg-red-500 p-1 text-white hover:bg-red-600 group-hover:block"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
