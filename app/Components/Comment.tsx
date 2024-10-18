import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

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
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onLike: (commentId: string) => void;
  onUnlike: (commentId: string) => void;
}

export const Comment: React.FC<CommentProps> = ({ comment, onDelete, onEdit, onLike, onUnlike }) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit(comment.id, editedContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(false);
  };

  const handleLikeToggle = () => {
    if (comment.isLiked) {
      onUnlike(comment.id);
    } else {
      onLike(comment.id);
    }
  };

  const isEdited = new Date(comment.updatedAt).getTime() !== new Date(comment.createdAt).getTime();

  return (
    <div className="comment">
      {isEditing ? (
        <>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <p>{comment.content}</p>
          <p>By: {comment.user.name}</p>
          <button onClick={handleLikeToggle}>
            {comment.isLiked ? 'Unlike' : 'Like'} ({comment.likes})
          </button>
          {user && user.sub === comment.user.id && (
            <>
              <button onClick={handleEdit}>Edit</button>
              <button onClick={() => onDelete(comment.id)}>Delete</button>
            </>
          )}
          {isEdited && <small className="text-muted">Edited</small>}
        </>
      )}
    </div>
  );
};