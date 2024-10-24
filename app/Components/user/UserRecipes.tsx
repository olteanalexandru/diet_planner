import { Recipe } from '@/app/types';
import { RecipeCard } from '../recipes/RecipeCard';

export const UserRecipes: React.FC<{ recipes: Recipe[] }> = ({ recipes }) => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-100">Recipes</h2>
      {recipes.length > 0 ? (
        <div className="grid gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No recipes yet</p>
      )}
    </div>
  );