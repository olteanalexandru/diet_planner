import {  ApiResponse, CommentResponse } from '../types/';
import { API_ENDPOINTS } from '../utils/constants';

export const commentService = {
  async getComments(recipeId: string): Promise<ApiResponse<CommentResponse>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}?recipeId=${recipeId}`);
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to fetch comments', status: 500 };
    }
  },

  async addComment(recipeId: string, content: string): Promise<ApiResponse<CommentResponse>> {
    try {
      const response = await fetch(API_ENDPOINTS.COMMENTS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, content }),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to add comment', status: 500 };
    }
  },

  async updateComment(commentId: string, content: string): Promise<ApiResponse<CommentResponse>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      return { data, status: response.status };
    } catch (error) {
      return { error: 'Failed to update comment', status: 500 };
    }
  },

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}`, {
        method: 'DELETE',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to delete comment', status: 500 };
    }
  },

  async likeComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}/like`, {
        method: 'POST',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to like comment', status: 500 };
    }
  },

  async unlikeComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.COMMENTS}/${commentId}/like`, {
        method: 'DELETE',
      });
      return { status: response.status };
    } catch (error) {
      return { error: 'Failed to unlike comment', status: 500 };
    }
  },
};
