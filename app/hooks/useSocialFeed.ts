import { useState, useCallback } from 'react';
import { socialFeedService, SocialActivity } from '../services/socialFeedService';

interface UseSocialFeedState {
  activities: SocialActivity[];
  hasMore: boolean;
  page: number;
  loading: boolean;
  error: string | null;
}

export const useSocialFeed = (userId?: string) => {
  const [state, setState] = useState<UseSocialFeedState>({
    activities: [],
    hasMore: true,
    page: 1,
    loading: false,
    error: null,
  });

  const fetchFeed = useCallback(async (reset = false) => {
    if (state.loading || (!state.hasMore && !reset)) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const page = reset ? 1 : state.page;
      const response = userId
        ? await socialFeedService.getUserActivities(userId, page)
        : await socialFeedService.getFeed(page, 10, { category: '', sortBy: '', timeFrame: '' });

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.activities) {
        setState(prev => ({
          activities: reset 
            ? response.data!.activities 
            : [...prev.activities, ...response.data!.activities],
          hasMore: response.data!.hasMore,
          page: reset ? 2 : prev.page + 1,
          loading: false,
          error: null,
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch feed',
      }));
    }
  }, [state.loading, state.hasMore, state.page, userId]);

  const refreshFeed = useCallback(() => {
    return fetchFeed(true);
  }, [fetchFeed]);

  const toggleLike = useCallback(async (activityId: string, isLiked: boolean) => {
    try {
      const response = isLiked
        ? await socialFeedService.unlikeActivity(activityId)
        : await socialFeedService.likeActivity(activityId);

      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({
        ...prev,
        activities: prev.activities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              likes: isLiked ? activity.likes - 1 : activity.likes + 1,
              isLiked: !isLiked,
            };
          }
          return activity;
        }),
      }));

      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to toggle like',
      }));
      return false;
    }
  }, []);

  const addComment = useCallback(async (activityId: string, content: string) => {
    try {
      const response = await socialFeedService.commentOnActivity(activityId, content);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.comment) {
        setState(prev => ({
          ...prev,
          activities: prev.activities.map(activity => {
            if (activity.id === activityId) {
              return {
                ...activity,
                comments: [...activity.comments, response.data!.comment],
              };
            }
            return activity;
          }),
        }));
        return response.data.comment;
      }
      return null;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to add comment',
      }));
      return null;
    }
  }, []);

  const deleteComment = useCallback(async (activityId: string, commentId: string) => {
    try {
      const response = await socialFeedService.deleteActivityComment(activityId, commentId);
      if (response.error) {
        throw new Error(response.error);
      }

      setState(prev => ({
        ...prev,
        activities: prev.activities.map(activity => {
          if (activity.id === activityId) {
            return {
              ...activity,
              comments: activity.comments.filter(comment => comment.id !== commentId),
            };
          }
          return activity;
        }),
      }));

      return true;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to delete comment',
      }));
      return false;
    }
  }, []);

  const shareRecipe = useCallback(async (recipeId: string) => {
    try {
      const response = await socialFeedService.shareRecipe(recipeId);
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.activity) {
        setState(prev => ({
          ...prev,
          activities: [response.data!.activity, ...prev.activities],
        }));
        return response.data.activity;
      }
      return null;
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to share recipe',
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    fetchFeed,
    refreshFeed,
    toggleLike,
    addComment,
    deleteComment,
    shareRecipe,
  };
};
