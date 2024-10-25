import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, Award, ChefHat, Users } from 'lucide-react';
import { SocialActivity } from '../../types/social';
import { useSocialFeed } from '../../context/SocialFeedContext';

interface ActivityCardProps {
  activity: SocialActivity;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [comment, setComment] = useState('');
  const { likeActivity, unlikeActivity, addComment } = useSocialFeed();

  const handleLikeToggle = async () => {
    try {
      if (activity.interactions.hasLiked) {
        await unlikeActivity(activity.id);
      } else {
        await likeActivity(activity.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await addComment(activity.id, comment);
      setComment('');
      setIsCommenting(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'recipe_created':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-cyber-primary" />
              <Link href={`/profile/${activity.userId}`} className="font-medium hover:text-cyber-primary">
                {activity.userName}
              </Link>
              <span>created a new recipe:</span>
            </div>
            {activity.recipeId && (
              <Link 
                href={`/recipe/${activity.recipeId}`}
                className="block relative rounded-lg overflow-hidden hover:scale-[1.02] transition-transform duration-200"
              >
                <img
                  src={activity.recipeImage || '/placeholder-recipe.jpg'}
                  alt={activity.recipeTitle}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 p-4">
                  <h3 className="text-xl font-semibold text-white">{activity.recipeTitle}</h3>
                </div>
              </Link>
            )}
          </div>
        );

      case 'achievement_earned':
        return (
          <div className="flex items-center gap-4 bg-cyber-primary/10 p-4 rounded-lg">
            <Award className="w-8 h-8 text-cyber-primary" />
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${activity.userId}`} className="font-medium hover:text-cyber-primary">
                  {activity.userName}
                </Link>
                <span>earned an achievement!</span>
              </div>
              <div className="text-lg font-semibold text-cyber-primary mt-1">
                {activity.achievement?.title}
              </div>
              <p className="text-sm text-gray-400">{activity.achievement?.description}</p>
            </div>
          </div>
        );

      case 'started_following':
        return (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyber-primary" />
            <Link href={`/profile/${activity.userId}`} className="font-medium hover:text-cyber-primary">
              {activity.userName}
            </Link>
            <span>started following</span>
            <Link href={`/profile/${activity.targetUserId}`} className="font-medium hover:text-cyber-primary">
              {activity.targetUserName}
            </Link>
          </div>
        );

      // Add more cases for other activity types...
      
      default:
        return null;
    }
  };

  return (
    <div className="card-cyber">
      <div className="space-y-4">
        {renderActivityContent()}

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-space-700">
          <div className="flex items-center gap-6">
            <button
              onClick={handleLikeToggle}
              className="flex items-center gap-2 text-gray-400 hover:text-cyber-primary transition-colors"
            >
              <Heart
                className={activity.interactions.hasLiked ? 'fill-current text-cyber-primary' : ''}
                size={20}
              />
              <span>{activity.interactions.likes}</span>
            </button>
            <button
              onClick={() => setIsCommenting(!isCommenting)}
              className="flex items-center gap-2 text-gray-400 hover:text-cyber-primary transition-colors"
            >
              <MessageCircle size={20} />
              <span>{activity.interactions.comments}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-400 hover:text-cyber-primary transition-colors">
              <Share2 size={20} />
            </button>
          </div>
          <div className="text-sm text-gray-400">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </div>
        </div>

        {/* Comment Form */}
        {isCommenting && (
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <textarea
              className="form-textarea w-full"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCommenting(false)}
                className="btn-cyber-outline"
              >
                Cancel
              </button>
              <button type="submit" className="btn-cyber">
                Comment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};