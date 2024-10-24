
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Heart, Edit2, Trash2, X, Check } from 'lucide-react';
import Link from 'next/link';
import { Comment as CommentType } from '../types';

interface CommentProps {
  comment: CommentType;
  onDelete: (commentId: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
}

export const Comment: React.FC<CommentProps> = ({ 
  comment, 
  onDelete, 
  onEdit, 
  onLike, 
  onUnlike 
}) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);
  const isEdited = new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) return;
    setIsLoading(true);
    try {
      await onEdit(comment.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setIsLoading(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (comment.isLiked) {
        await onUnlike(comment.id);
      } else {
        await onLike(comment.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border-b border-space-700 last:border-0">
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="form-textarea w-full bg-space-800 text-gray-100"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              disabled={isLoading}
              className="btn-cyber-outline flex items-center"
            >
              <Check size={16} className="mr-1" />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="btn-cyber-outline flex items-center"
            >
              <X size={16} className="mr-1" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <Link
                  href={`/profile/${comment.user.id}`}
                  className="font-medium text-cyber-primary hover:text-cyber-accent transition-colors duration-200"
                >
                  {comment.user.name}
                </Link>
                {isEdited && (
                  <span className="text-xs text-gray-500">(edited)</span>
                )}
              </div>
              <p className="text-gray-300">{comment.content}</p>
            </div>
            
            {user && user.sub === comment.user.id && (
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-cyber-primary transition-colors duration-200"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={handleLikeToggle}
              disabled={isLoading || !user}
              className="flex items-center space-x-1 text-gray-400 hover:text-cyber-primary transition-colors duration-200"
            >
              <Heart
                size={16}
                className={comment.isLiked ? 'text-cyber-primary fill-current' : ''}
              />
              <span>{comment.likes}</span>
            </button>
            <span className="text-gray-500 text-sm">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
        </>
      )}
    </div>
  );
};