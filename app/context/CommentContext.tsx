'use client';
import React, { createContext, useContext, useState } from 'react';
import { Comment } from '../types';

interface CommentContextType {
  comments: Comment[];
  addComment: (recipeId: string, content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const CommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [comments, setComments] = useState<Comment[]>([]);

  const addComment = async (recipeId: string, content: string) => {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, content }),
      });
      const data = await response.json();
      setComments(prevComments => [...prevComments, data.comment]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const editComment = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      setComments(prevComments => 
        prevComments.map(comment => comment.id === commentId ? data.comment : comment)
      );
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const likeComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: comment.likes + 1, isLiked: true } : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const unlikeComment = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: 'DELETE' });
      setComments(prevComments => prevComments.map(comment => 
        comment.id === commentId ? { ...comment, likes: comment.likes - 1, isLiked: false } : comment
      ));
    } catch (error) {
      console.error('Error unliking comment:', error);
    }
  };

  return (
    <CommentContext.Provider value={{ comments, addComment, editComment, deleteComment, likeComment, unlikeComment }}>
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