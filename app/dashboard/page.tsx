'use client';

import React from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Recipe } from '../types';
import { RecipeCard } from '../Components/recipes/RecipeCard';
import Link from 'next/link';
import { DashboardProvider, useDashboard } from '../context/DashboardContext';

const StatsCard = ({ title, value }: { title: string; value: number }) => (
  <div className="bg-space-800 rounded-lg p-6 border border-space-700">
    <h3 className="text-space-400 text-sm mb-2">{title}</h3>
    <p className="text-2xl font-bold text-cyber-primary">{value}</p>
  </div>
);

const RecipesList: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => {
  const draftRecipes = recipes.filter(recipe => recipe.status === 'draft');
  const publishedRecipes = recipes.filter(recipe => recipe.status === 'published');

  return (
    <div className="space-y-8">
      {draftRecipes.length > 0 && (
        <section className="bg-space-900/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-cyber-primary flex items-center gap-2">
            <span className="i-lucide-edit-3 w-5 h-5" />
            Drafts & Incomplete Recipes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftRecipes.map((recipe: Recipe) => (
              <div key={recipe.id} className="card-cyber">
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
        </section>
      )}

      <section className="bg-space-900/50 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-cyber-primary flex items-center gap-2">
          <span className="i-lucide-book-open w-5 h-5" />
          Published Recipes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publishedRecipes.map((recipe: Recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </section>
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

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin i-lucide-loader-2 w-8 h-8 text-cyber-primary" />
    </div>
  );
  
  if (!user) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <span className="i-lucide-lock w-12 h-12 text-cyber-primary mx-auto" />
        <p className="text-xl">Please log in to view your dashboard</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
      {error}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-cyber-primary mb-4 md:mb-0">
          Welcome back, {user.name}!
        </h1>
        <Link href="/create-recipe" 
          className="btn-cyber inline-flex items-center gap-2">
          <span className="i-lucide-plus w-5 h-5" />
          Create New Recipe
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Custom Recipes" value={customRecipes.filter(
          (recipe: Recipe) => recipe.status === 'published').length} />
        <StatsCard title="Favorite Recipes" value={favorites.length} />
        <StatsCard title="Followers" value={followersCount} />
        <StatsCard title="Following" value={followingCount} />
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <section className="bg-space-900/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-cyber-primary flex items-center gap-2">
            <span className="i-lucide-chef-hat w-5 h-5" />
            Your Latest Recipes
          </h2>
          {customRecipes.length > 0 ? (
            <div className="space-y-4">
              {customRecipes.slice(0, 3).filter(
                (recipe: Recipe) => recipe.status === 'published'
              ).map((recipe: Recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-space-400">
              <span className="i-lucide-utensils w-12 h-12 mx-auto mb-2" />
              <p>Start creating your first recipe!</p>
            </div>
          )}
        </section>

        <section className="bg-space-900/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-cyber-primary flex items-center gap-2">
            <span className="i-lucide-heart w-5 h-5" />
            Recent Favorites
          </h2>
          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.slice(0, 3).map((recipe: Recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-space-400">
              <span className="i-lucide-heart-off w-12 h-12 mx-auto mb-2" />
              <p>No favorite recipes yet</p>
            </div>
          )}
        </section>
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
