
export type RecipeCategory = 'all' | 'quick' | 'vegetarian' | 'desserts' | 'healthy' | 'budget';

export type SortOption = 'trending' | 'latest';

export interface DietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKeto?: boolean;
  isPescatarian?: boolean;
  isDairyFree?: boolean;
}

export interface RecipeFeedItem {
  id: string;
  title: string;
  category: RecipeCategory;
  tags: string[];
  imageUrl: string | null;
  imageUrlLarge: string | null;
  cookingTime: number;
  dietaryInfo: DietaryInfo;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  _count: {
    comments: number;
    favorites: number;
  };
  isLiked: boolean;
  createdAt: Date;
  viewCount: number;
}

export interface TrendingTag {
  tag: string;
  count: number;
}

export interface RecipeFeedResponse {
  recipes: RecipeFeedItem[];
  hasMore: boolean;
  total: number;
}