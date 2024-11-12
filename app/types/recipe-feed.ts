export type SortOption = 'trending' | 'latest';
export type Category = 'all' | 'quick' | 'vegetarian' | 'desserts' | 'healthy' | 'budget';

export interface RecipeFeedFilters {
  category?: Category;
  sort?: SortOption;
  page?: number;
}

export interface RecipeFeedResponse {
  recipes: Array<{
    id: string;
    title: string;
    imageUrl: string | null;
    imageUrlLarge: string | null;
    cookingTime: number;
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
    category: string;
    viewCount: number;
  }>;
  hasMore: boolean;
  total: number;
}

export interface RecipeFeedQueryParams {
  category?: Category;
  sort?: SortOption;
  page?: number;
  userId?: string;
}

export interface RecipeFeedState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  filters: RecipeFeedFilters;
}

export interface TrendingTag {
  tag: string;
  count: number;
}
