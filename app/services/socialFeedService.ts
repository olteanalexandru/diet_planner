import { ApiResponse } from '../types/';
import { API_ENDPOINTS } from '../utils/constants';

export interface SocialActivity {
  id: string;
  type: 'created' | 'liked' | 'commented' | 'shared';
  userId: string;
  recipeId?: string;
  commentId?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  recipe?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  comment?: {
    id: string;
    content: string;
  };
  likes: number;
  isLiked: boolean;
  comments: Array<{
    id: string;
    content: string;
    userId: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
    createdAt: string;
  }>;
}

interface SocialFeedResponse {
  activities: SocialActivity[];
  hasMore: boolean;
}

interface SocialFeedFilters {
  category: string;
  sortBy: string;
  timeFrame?: string;
}

export const socialFeedService = {
  async getFeed(page = 1, limit = 10, filters: SocialFeedFilters): Promise<ApiResponse<SocialFeedResponse>> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        category: filters.category,
        sortBy: filters.sortBy,
        ...(filters.timeFrame && { timeFrame: filters.timeFrame })
      });

      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}?${queryParams}`
      );
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch social feed', status: 500 };
    }
  },

  async likeActivity(activityId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}/${activityId}/like`,
        { method: 'POST' }
      );
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to like activity', status: 500 };
    }
  },

  async unlikeActivity(activityId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}/${activityId}/like`,
        { method: 'DELETE' }
      );
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to unlike activity', status: 500 };
    }
  },

  async commentOnActivity(
    activityId: string,
    content: string
  ): Promise<ApiResponse<{ comment: SocialActivity['comments'][0] }>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}/${activityId}/comment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to comment on activity', status: 500 };
    }
  },

  async deleteActivityComment(
    activityId: string,
    commentId: string
  ): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}/${activityId}/comment/${commentId}`,
        { method: 'DELETE' }
      );
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to delete comment', status: 500 };
    }
  },

  async shareRecipe(recipeId: string): Promise<ApiResponse<{ activity: SocialActivity }>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.SOCIAL_FEED}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shared',
          recipeId,
        }),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to share recipe', status: 500 };
    }
  },

  async getUserActivities(
    userId: string,
    page = 1,
    limit = 10
  ): Promise<ApiResponse<SocialFeedResponse>> {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.SOCIAL_FEED}?userId=${userId}&page=${page}&limit=${limit}`
      );
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch user activities', status: 500 };
    }
  },
};
