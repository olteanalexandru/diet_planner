export const CATEGORIES = [
  { id: 'all', name: 'All Recipes', icon: '🍽️' },
  { id: 'quick', name: 'Quick & Easy', icon: '⚡' },
  { id: 'vegetarian', name: 'Vegetarian', icon: '🥗' },
  { id: 'desserts', name: 'Desserts', icon: '🍰' },
  { id: 'healthy', name: 'Healthy', icon: '💪' },
  { id: 'budget', name: 'Budget', icon: '💰' },
] as const;

export const DIET_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Keto',
  'Paleo',
  'Dairy-Free',
  'Low-Carb',
  'Mediterranean',
] as const;

export const TAG_OPTIONS = [
  'Quick',
  'Easy',
  'Healthy',
  'Dessert',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snack',
  'Appetizer',
  'Side Dish',
  'Main Course',
  'Soup',
  'Salad',
  'Baking',
  'Grilling',
] as const;

export const ITEMS_PER_PAGE = 12;
