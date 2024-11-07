import { User, Recipe } from './index';

export type ActivityType = 
  | 'generated'    // When AI generates a recipe
  | 'created'      // When user creates a recipe
  | 'liked'        // When user likes a recipe
  | 'commented'    // When user comments on a recipe
  | 'shared'       // When user shares a recipe
  | 'started_following'  // When user follows another user
  | 'achievement_earned' // When user earns an achievement
  | 'recipe_milestone';  // When recipe reaches a milestone

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  targetUserId?: string;
  recipeId?: string;
  milestone?: number;
  achievementId?: string;
  createdAt: Date;
}

export interface SocialActivity {
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
  achievement?: Achievement;
  milestoneCount?: number;
  commentContent?: string;
  timestamp: string | Date;
  interactions: ActivityInteractions;
}

export interface ActivityInteractions {
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasCommented?: boolean;
}

export interface ActivityComment {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage?: string;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isLiked: boolean;
}

export interface ActivityGroup {
  date: string;
  activities: SocialActivity[];
}

export interface ActivityFilter {
  type?: ActivityType[];
  userId?: string;
  timeframe?: TimeFrame;
  following?: boolean;
}

export type TimeFrame = 'today' | 'week' | 'month' | 'all';

export interface SocialContextType {
  activities: ActivityGroup[];
  isLoading: boolean;
  error: string | null;
  filters: ActivityFilter;
  hasMore: boolean;
  fetchActivities: (page?: number) => Promise<void>;
  setFilters: (filters: ActivityFilter) => void;
  likeActivity: (activityId: string) => Promise<void>;
  unlikeActivity: (activityId: string) => Promise<void>;
  addComment: (activityId: string, content: string) => Promise<void>;
  shareActivity: (recipeId: string) => Promise<void>;
}

export interface ActivityCardProps {
  activity: SocialActivity;
  onLike?: (activityId: string) => Promise<void>;
  onComment?: (activityId: string, content: string) => Promise<void>;
}

export interface ActivityCommentsProps {
  activityId: string;
  onClose: () => void;
}

export interface ActivityMetricsProps {
  likes: number;
  comments: number;
  shares: number;
  className?: string;
}

export interface ShareModalProps {
  activityId: string;
  recipeTitle?: string;
  onClose: () => void;
}

export interface AchievementModalProps {
  achievement: {
    title: string;
    description: string;
    icon: string;
  };
  onClose: () => void;
}

export interface SocialFeedResponse {
  activities: ActivityGroup[];
  hasMore: boolean;
}

export interface ActivityResponse {
  activity: SocialActivity;
}

export interface ActivityCommentsResponse {
  comments: ActivityComment[];
  hasMore: boolean;
}

export interface ActivityLikeResponse {
  likes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  userId: string;
  unlockedAt: Date;
  criteria?: AchievementCriteria;
}

export interface AchievementCriteria {
  type: 'count' | 'streak' | 'milestone';
  target: number;
  current: number;
}

export interface SocialFeedState {
  activities: ActivityGroup[];
  filters: ActivityFilter;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SocialEventHandlers {
  onLike: (activityId: string) => Promise<void>;
  onComment: (activityId: string, content: string) => Promise<void>;
  onShare: (activityId: string) => void;
  onUserClick: (userId: string) => void;
  onRecipeClick: (recipeId: string) => void;
}

export interface FilterOptions {
  timeframe: TimeFrame;
  activityTypes: ActivityType[];
  following: boolean;
}

export interface TrendingTopic {
  tag: string;
  count: number;
  trending?: boolean;
}

export interface UserMetrics {
  posts: number;
  followers: number;
  following: number;
  achievements: number;
}

export interface ActivityMetrics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}
