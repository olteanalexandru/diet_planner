'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { ActivityGroup, SocialContextType } from '../types';
import { socialFeedService } from '../services/socialFeedService';

type ActivityType = 
  | 'generated'    
  | 'created'     
  | 'liked'       
  | 'commented'    
  | 'shared'       
  | 'started_following'  
  | 'achievement_earned'
  | 'recipe_liked'
  | 'recipe_created' 
  | 'recipe_milestone';

interface DBActivity {
  id: string;
  type: ActivityType;
  userId: string;
  targetUserId?: string | null;
  recipeId?: string | null;
  milestone?: number | null;
  achievementId?: string | null;
  createdAt: Date;
  user?: {
    name: string | null;
    avatar: string | null;
  } | null;
  targetUser?: {
    name: string | null;
  } | null;
  recipe?: {
    title: string | null;
    imageUrl: string | null;
  } | null;
  likes: Array<{ userId: string }>;
  comments: Array<{
    user: {
      name: string | null;
      avatar: string | null;
    } | null;
  }>;
}

interface SocialFeedFilters {
  category: string;
  sortBy: 'trending' | 'latest';
  timeFrame?: 'today' | 'week' | 'month' | 'all';
}

interface ActivityInteractions {
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasCommented?: boolean;
}

interface SocialActivity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  userImage?: string;
  targetUserId?: string;
  targetUserName?: string;
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string;
  commentContent?: string;
  timestamp: string | Date;
  interactions: ActivityInteractions;
}

const SocialFeedContext = createContext<SocialContextType | undefined>(undefined);

export const useSocialFeed = () => {
  const context = useContext(SocialFeedContext);
  if (!context) {
    throw new Error('useSocialFeed must be used within a SocialFeedProvider');
  }
  return context;
};

interface SocialFeedProviderProps {
  children: ReactNode;
}

export const SocialFeedProvider = ({ children }: SocialFeedProviderProps) => {
  const [activities, setActivities] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SocialFeedFilters>({
    category: 'all',
    sortBy: 'trending'
  });
  const [hasMore, setHasMore] = useState(true);

  const transformServiceActivity = (serviceActivity: DBActivity): SocialActivity => {
    return {
      id: serviceActivity.id,
      type: serviceActivity.type,
      userId: serviceActivity.userId,
      userName: serviceActivity.user?.name || '',
      userImage: serviceActivity.user?.avatar || undefined,
      targetUserId: serviceActivity.targetUserId || undefined,
      targetUserName: serviceActivity.targetUser?.name || undefined,
      recipeId: serviceActivity.recipeId || undefined,
      recipeTitle: serviceActivity.recipe?.title || undefined,
      recipeImage: serviceActivity.recipe?.imageUrl || undefined,
      timestamp: serviceActivity.createdAt,
      interactions: {
        likes: serviceActivity.likes.length,
        comments: serviceActivity.comments.length,
        hasLiked: serviceActivity.likes.some((like: { userId: string }) => like.userId === serviceActivity.userId),
        hasCommented: serviceActivity.comments.some((comment: { user: { name: string | null } | null }) => 
          comment.user?.name === serviceActivity.user?.name
        )
      }
    };
  };

  const fetchActivities = useCallback(async (page: number = 1) => {
    if (isLoading || (page > 1 && !hasMore)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await socialFeedService.getFeed(page, 10, {
        category: filters.category,
        sortBy: filters.sortBy,
        timeFrame: filters.timeFrame
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        // Transform and group activities by date
        const transformedActivities = response.data.activities.map(activity => 
          transformServiceActivity(activity as unknown as DBActivity)
        );
        
        const groupedActivities = transformedActivities.reduce<ActivityGroup[]>((groups, activity) => {
          const date = new Date(activity.timestamp).toLocaleDateString();
          const existingGroup = groups.find(group => group.date === date);
          
          if (existingGroup) {
            existingGroup.activities.push(activity);
          } else {
            groups.push({ date, activities: [activity] });
          }
          
          return groups;
        }, []);

        setActivities(prevGroups => 
          page === 1 ? groupedActivities : [...prevGroups, ...groupedActivities]
        );
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoading, hasMore]);

  const likeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await socialFeedService.likeActivity(activityId);
      if (response.status === 200) {
        setActivities((prevGroups: ActivityGroup[]) => 
          prevGroups.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      hasLiked: true,
                      likes: activity.interactions.likes + 1
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to like activity');
    }
  }, []);

  const unlikeActivity = useCallback(async (activityId: string) => {
    try {
      const response = await socialFeedService.unlikeActivity(activityId);
      if (response.status === 200) {
        setActivities((prevGroups: ActivityGroup[]) => 
          prevGroups.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      hasLiked: false,
                      likes: activity.interactions.likes - 1
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to unlike activity');
    }
  }, []);

  const addComment = useCallback(async (activityId: string, content: string) => {
    try {
      const response = await socialFeedService.commentOnActivity(activityId, content);
      if (response.status === 200 && response.data) {
        setActivities((prevGroups: ActivityGroup[]) => 
          prevGroups.map((group: ActivityGroup) => ({
            ...group,
            activities: group.activities.map(activity => 
              activity.id === activityId
                ? {
                    ...activity,
                    interactions: {
                      ...activity.interactions,
                      comments: activity.interactions.comments + 1,
                      hasCommented: true
                    }
                  }
                : activity
            )
          }))
        );
      }
    } catch (error) {
      setError('Failed to add comment');
    }
  }, []);

  const shareActivity = useCallback(async (recipeId: string) => {
    try {
      const response = await socialFeedService.shareRecipe(recipeId);
      if (response.status === 200 && response.data) {
        // Refresh the feed to show the new shared activity
        fetchActivities(1);
      }
    } catch (error) {
      setError('Failed to share recipe');
    }
  }, [fetchActivities]);

  const handleSetFilters = useCallback((newFilters: Partial<SocialFeedFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setActivities([]);
    setHasMore(true);
  }, []);

  const followUser = useCallback(async (userId: string) => {
    try {
      const response = await socialFeedService.followUser(userId);
      if (response.status === 200) {
        // Optionally, you can refresh the feed or update the state to reflect the follow action
      }
    } catch (error) {
      setError('Failed to follow user');
    }
  }, []);

  const unfollowUser = useCallback(async (userId: string) => {
    try {
      const response = await socialFeedService.unfollowUser(userId);
      if (response.status === 200) {
        // Optionally, you can refresh the feed or update the state to reflect the unfollow action
      }
    } catch (error) {
      setError('Failed to unfollow user');
    }
  }, []);

  return (
    <SocialFeedContext.Provider
      value={{
        activities,
        isLoading,
        error,
        filters,
        hasMore,
        fetchActivities,
        setFilters: handleSetFilters,
        likeActivity,
        unlikeActivity,
        addComment,
        shareActivity,
        followUser,
        unfollowUser
      }}
    >
      {children}
    </SocialFeedContext.Provider>
  );
};

export { SocialFeedContext };
