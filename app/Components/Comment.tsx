
import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Heart, Edit2, Trash2, X, Check } from 'lucide-react';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
    };
    likes: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
  };
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newContent: string) => void;
  onLike?: (commentId: string) => void;
  onUnlike?: (commentId: string) => void;
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
  const isEdited = new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  const handleSaveEdit = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(comment.id, editedContent);
      setIsEditing(false);
    }
  };

  const handleLikeToggle = () => {
    if (!user) return; // Prevent unauthenticated users from liking
    if (comment.isLiked && onUnlike) {
      onUnlike(comment.id);
    } else if (!comment.isLiked && onLike) {
      onLike(comment.id);
    }
  };

  return (
    <div className="p-4">
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className="form-textarea"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="btn-primary flex items-center"
            >
              <Check size={16} className="mr-1" />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="btn-secondary flex items-center"
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
                <span className="font-medium text-gray-100">{comment.user.name}</span>
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
                  className="p-1 text-gray-400 hover:text-cyber-primary transition-colors duration-200"
                >
                  <Edit2 size={16} />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <button
              onClick={handleLikeToggle}
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