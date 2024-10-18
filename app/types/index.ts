

export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    name: string;
  };
  likes: number;
  isLiked: boolean;
  createdAt: string;
  userId: string;
}

export interface Recipe {
  comments: any;
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  imageUrl?: string;
  imageUrlLarge?: string;
  authorId: string;
  author?: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'free' | 'premium';
}

export interface FavouriteRecipeComponentProps {
  recipe: Recipe;
  favorites: Recipe[];
  setFavorites: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
}

export interface MealPlan {
  id: string;
  date: string;
  recipe: Recipe;
}


