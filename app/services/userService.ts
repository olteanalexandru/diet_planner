import { User, ApiResponse, UserResponse } from '../types/';

const BASE_URL = '/api/users';

export const userService = {
  async getUserProfile(userId: string): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await fetch(`${BASE_URL}/${userId}`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch user profile', status: 500 };
    }
  },

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${BASE_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to update user profile', status: 500 };
    }
  },

  async getUserStats(userId: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${BASE_URL}/${userId}/stats`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch user stats', status: 500 };
    }
  },

  async followUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/followUsers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to follow user', status: 500 };
    }
  },

  async unfollowUser(userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`/api/followUsers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to unfollow user', status: 500 };
    }
  }
};
