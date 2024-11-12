'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';

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
            {draftRecipes.map((recipe: Recipe) => (
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
          {publishedRecipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </div>
    </div>
  );
};

function DashboardContent() {
  const { user, isLoading } = useUser();
  const { 
    customRecipes, 
    favorites, 
    followersCount, 
    followingCount, 
    error 
  } = useDashboard();

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
            customRecipes.map((recipe: Recipe) => (
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
            favorites.map((recipe: Recipe) => (
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

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
