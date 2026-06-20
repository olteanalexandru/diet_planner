export const CATEGORIES = [
  { id: 'breakfast', name: 'Breakfast', icon: '🍳' },
  { id: 'lunch', name: 'Lunch', icon: '🥪' },
  { id: 'dinner', name: 'Dinner', icon: '🍽️' },
  { id: 'dessert', name: 'Dessert', icon: '🍰' },
  { id: 'snack', name: 'Snack', icon: '🍿' },
  { id: 'beverage', name: 'Beverage', icon: '🥤' },
] as const;

export const DIFFICULTY_LEVELS = [
  { id: 'easy', name: 'Easy', icon: '👶' },
  { id: 'medium', name: 'Medium', icon: '👨‍🍳' },
  { id: 'hard', name: 'Advanced', icon: '👨‍🔬' },
] as const;

export const DIETARY_TAGS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
  'Keto',
  'Paleo',
  'Mediterranean',
] as const;

export const CUISINE_TAGS = [
  'Italian',
  'Mexican',
  'Chinese',
  'Japanese',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'American',
] as const;

export const PREMIUM_FEATURES = [
  'Unlimited AI recipe generations & nutrition estimates',
  'AI weekly meal plan generator',
  'AI chef assistant: substitutions, tips & pairings',
  'Access to premium-exclusive recipes',
  'Unlimited recipe collections',
  'Shopping list builder from your meal plan',
  'Ad-free experience',
] as const;

export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Highest Rated' },
] as const;

export const ITEMS_PER_PAGE = 12;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const API_ENDPOINTS = {
  RECIPES: '/api/recipes',
  USERS: '/api/users',
  COMMENTS: '/api/comments',
  FAVORITES: '/api/favorites',
  SOCIAL_FEED: '/api/socialFeed',
  MEAL_PLANNING: '/api/mealPlanning',
} as const;

export const RECIPE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  AI_GENERATED: 'ai_generated',
} as const;

export const DEFAULT_AVATAR = '/default-avatar.png';

export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  ACHIEVEMENT: 'achievement',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_INPUT: 'Please check your input and try again',
  SERVER_ERROR: 'Something went wrong. Please try again later',
} as const;

export const ACHIEVEMENT_TYPES = {
  FIRST_RECIPE: 'first_recipe',
  POPULAR_RECIPE: 'popular_recipe',
  MASTER_CHEF: 'master_chef',
  SOCIAL_BUTTERFLY: 'social_butterfly',
} as const;

export const THEME_COLORS = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
} as const;
