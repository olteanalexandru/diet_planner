import { Recipe, User } from '../types';

interface UserResponse {
  user: User;
}

interface FavoritesResponse {
  favorites: Recipe[];
}

interface FollowCountsResponse {
  followersCount: number;
  followingCount: number;
}

interface UserStatsResponse {
  recipesCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
}

class UserService {
  async getUserProfile(userId: string) {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  }

  async updateUserProfile(userId: string, userData: Partial<User>) {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    return await response.json();
  }

  async getUserStats(userId: string): Promise<UserStatsResponse> {
    const response = await fetch(`/api/users/${userId}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    return await response.json();
  }

  async getFavorites(): Promise<FavoritesResponse> {
    const response = await fetch('/api/favorites');
    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }
    return await response.json();
  }

  async getFollowCounts(): Promise<FollowCountsResponse> {
    const response = await fetch('/api/followCounts');
    if (!response.ok) {
      throw new Error('Failed to fetch follow counts');
    }
    return await response.json();
  }

  async followUser(userId: string) {
    const response = await fetch('/api/followUsers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to follow user');
    }
    return await response.json();
  }

  async unfollowUser(userId: string) {
    const response = await fetch('/api/followUsers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      throw new Error('Failed to unfollow user');
    }
    return await response.json();
  }
}

export const userService = new UserService();
