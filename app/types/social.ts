
import { User, Recipe } from './index';

export type ActivityType = 
  | 'recipe_created'
  | 'recipe_liked'
  | 'comment_added'
  | 'started_following'
  | 'achievement_earned'
  | 'recipe_milestone'
  | 'weekly_digest';

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
}

// Component Props Types
export interface ActivityCardProps {
  activity: SocialActivity;
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

// API Response Types
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

// Achievement Types
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

// Social Feed State Types
export interface SocialFeedState {
  activities: ActivityGroup[];
  filters: ActivityFilter;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
}

// Social Feed Event Handlers
export interface SocialEventHandlers {
  onLike: (activityId: string) => Promise<void>;
  onComment: (activityId: string, content: string) => Promise<void>;
  onShare: (activityId: string) => void;
  onUserClick: (userId: string) => void;
  onRecipeClick: (recipeId: string) => void;
}

// Social Feed Filter Types
export interface FilterOptions {
  timeframe: TimeFrame;
  activityTypes: ActivityType[];
  following: boolean;
}

// Trending Topics Types
export interface TrendingTopic {
  tag: string;
  count: number;
  trending?: boolean;
}

// Social Metrics Types
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
