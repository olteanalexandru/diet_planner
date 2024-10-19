import React, { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Heart } from 'lucide-react';

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
    <div className="comment mb-3 p-3 bg-light rounded">
      {isEditing ? (
        <>
          <textarea
            className="form-control mb-2"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
          />
          <button className="btn btn-primary btn-sm me-2" onClick={handleSaveEdit}>Save</button>
          <button className="btn btn-secondary btn-sm" onClick={handleCancelEdit}>Cancel</button>
        </>
      ) : (
        <>
          <p className="mb-1">{comment.content}</p>
          <small className="text-muted">By: {comment.user.name}</small>
          <div className="mt-2">
            <button className="btn btn-link btn-sm p-0 me-3" onClick={handleLikeToggle}>
              <Heart size={16} fill={comment.isLiked ? 'red' : 'none'} color="red" />
              <span className="ms-1">{comment.likes}</span>
            </button>
            {user && user.sub === comment.user.id && (
              <>
                <button className="btn btn-link btn-sm text-primary p-0 me-2" onClick={handleEdit}>Edit</button>
                <button className="btn btn-link btn-sm text-danger p-0" onClick={() => onDelete(comment.id)}>Delete</button>
              </>
            )}
            {isEdited && <small className="text-muted ms-2">(Edited)</small>}
          </div>
        </>
      )}
    </div>
  );
};