'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import Link from 'next/link';



const RecipesList: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
  const draftRecipes = recipes.filter(recipe => recipe.status === 'draft');
  const publishedRecipes = recipes.filter(recipe => recipe.status === 'published');

  return (
    <div className="space-y-8">
      {draftRecipes.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-cyber-primary">
            Drafts & Incomplete Recipes
          </h2>
          <div className="grid gap-6">
            {draftRecipes.map(recipe => (
              <div key={recipe.id} className="card-cyber relative">
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-cyber-primary/10 text-cyber-primary text-sm">
                    Draft
                  </span>
                </div>
                <RecipeCard recipe={recipe} />
                <div className="p-4 border-t border-space-700">
                  <Link
                    href={`/create-recipe/${recipe.id}`}
                    className="btn-cyber-outline w-full text-center"
                  >
                    Complete Recipe
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Published Recipes</h2>
        <div className="grid gap-6">
          {publishedRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [customRecipes, setCustomRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCustomRecipes();
      fetchFavorites();
      fetchFollowCounts();
    }
  }, [user]);

  const fetchCustomRecipes = async () => {
    try {
      if (!user?.sub) {
        throw new Error('No user ID available');
      }
  
      const response = await fetch(`/api/recipes?userId=${encodeURIComponent(user.sub)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch custom recipes');
      }
      const data = await response.json();
      setCustomRecipes(data.recipes);
    } catch (error) {
      console.error('Error fetching custom recipes:', error);
      setError(error instanceof Error ? error.message : 'Failed to load custom recipes');
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites');
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites');
    }
  };

  const fetchFollowCounts = async () => {
    try {
      const response = await fetch('/api/followCounts');
      if (!response.ok) {
        throw new Error('Failed to fetch follow counts');
      }
      const data = await response.json();
      setFollowersCount(data.followersCount);
      setFollowingCount(data.followingCount);
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setError('Failed to load social stats');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your dashboard.</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1>Welcome, {user.name}!</h1>
      <div className="row mt-4">
        <div className="col-md-6">
          <h2>Your Custom Recipes</h2>
          {customRecipes.length > 0 ? (
            customRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't created any custom recipes yet.</p>
          )}
          <Link href="/create-recipe" className="btn btn-primary mt-3">Create New Recipe</Link>
        </div>
        <div className="col-md-6">
          <h2>Your Favorites</h2>
          {favorites.length > 0 ? (
            favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          ) : (
            <p>You haven't added any favorites yet.</p>
          )}
        </div>
      </div>
      <div className="mt-4">
        <h2>Social Stats</h2>
        <p>Followers: {followersCount}</p>
        <p>Following: {followingCount}</p>
      </div>
      <RecipesList recipes={customRecipes} />
    </div>

   
  );
}