
import React from 'react';
import { Recipe } from '@/app/types';
import { RecipeCard } from '../recipes/RecipeCard';

interface ProfileTabsProps {
  recipes: Recipe[];
  activeTab: 'recipes' | 'favorites' | 'activity';
  onTabChange: (tab: 'recipes' | 'favorites' | 'activity') => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  recipes,
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: 'recipes', label: 'Recipes', icon: '🍳' },
    { id: 'favorites', label: 'Favorites', icon: '❤️' },
    { id: 'activity', label: 'Activity', icon: '📊' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-cyber-primary text-space-900'
                : 'hover:bg-space-700 text-gray-400'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'recipes' && (
          <div className="grid gap-6">
            {recipes.length > 0 ? (
              recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))
            ) : (
              <p className="text-center py-8 text-gray-400">
                No recipes yet
              </p>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <p className="text-center py-8 text-gray-400">
            Coming soon...
          </p>
        )}

        {activeTab === 'activity' && (
          <p className="text-center py-8 text-gray-400">
            Coming soon...
          </p>
        )}
      </div>
    </div>
  );
};