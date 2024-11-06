import { Recipe, User } from '../types';

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const getDifficultyColor = (difficulty: Recipe['difficulty']): string => {
  const colors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500',
  };
  return colors[difficulty] || colors.medium;
};

export const getProfileCompleteness = (user: User): number => {
  const fields = [
    user.name,
    user.bio,
    user.location,
    user.website,
    user.avatar,
    user.specialties?.length > 0,
    user.dietaryPreferences?.length > 0,
  ];
  
  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const validateRecipe = (recipe: Partial<Recipe>): string[] => {
  const errors: string[] = [];

  if (!recipe.title?.trim()) {
    errors.push('Title is required');
  }

  if (!recipe.ingredients?.length) {
    errors.push('At least one ingredient is required');
  }

  if (!recipe.instructions?.length) {
    errors.push('At least one instruction is required');
  }

  if (!recipe.cookingTime || recipe.cookingTime < 1) {
    errors.push('Valid cooking time is required');
  }

  if (!recipe.servings || recipe.servings < 1) {
    errors.push('Valid number of servings is required');
  }

  return errors;
};

export const groupRecipesByCategory = (recipes: Recipe[]): Record<string, Recipe[]> => {
  return recipes.reduce((acc, recipe) => {
    const category = recipe.category || 'Uncategorized';
    return {
      ...acc,
      [category]: [...(acc[category] || []), recipe],
    };
  }, {} as Record<string, Recipe[]>);
};

export const calculateNutritionTotals = (recipe: Recipe) => {
  return {
    calories: recipe.calories || 0,
    protein: recipe.protein || 0,
    carbs: recipe.carbs || 0,
    fat: recipe.fat || 0,
  };
};
