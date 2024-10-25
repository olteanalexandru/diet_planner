'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Comment } from '../types';

interface CommentContextType {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  fetchComments: (recipeId: string) => Promise<void>;
  addComment: (recipeId: string, content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (recipeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/comments?recipeId=${recipeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(async (recipeId: string, content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const { comment } = await response.json();
      setComments(prevComments => [comment, ...prevComments]);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const editComment = useCallback(async (commentId: string, content: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to edit comment');
      }

      const { comment } = await response.json();
      setComments(prevComments =>
        prevComments.map(c => (c.id === commentId ? comment : c))
      );
    } catch (error) {
      console.error('Error editing comment:', error);
      setError('Failed to edit comment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete comment');
      }

      setComments(prevComments =>
        prevComments.filter(comment => comment.id !== commentId)
      );
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Failed to delete comment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const likeComment = useCallback(async (commentId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      const { likes } = await response.json();
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes, isLiked: true }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
      setError('Failed to like comment');
      throw error;
    }
  }, []);

  const unlikeComment = useCallback(async (commentId: string) => {
    setError(null);
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unlike comment');
      }

      const { likes } = await response.json();
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId
            ? { ...comment, likes, isLiked: false }
            : comment
        )
      );
    } catch (error) {
      console.error('Error unliking comment:', error);
      setError('Failed to unlike comment');
      throw error;
    }
  }, []);

  return (
    <CommentContext.Provider
      value={{
        comments,
        isLoading,
        error,
        fetchComments,
        addComment,
        editComment,
        deleteComment,
        likeComment,
        unlikeComment,
      }}
    >
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
};