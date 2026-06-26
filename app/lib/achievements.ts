import prisma from './db';
import { ACHIEVEMENT_TYPES } from '../utils/constants';

type AchievementKey = keyof typeof ACHIEVEMENT_TYPES;

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementKey, { title: string; description: string; icon: string }> = {
  FIRST_RECIPE: {
    title: 'First Recipe',
    description: 'Published your first recipe',
    icon: '🍳',
  },
  POPULAR_RECIPE: {
    title: 'Popular Recipe',
    description: 'One of your recipes reached 10 likes',
    icon: '🔥',
  },
  MASTER_CHEF: {
    title: 'Master Chef',
    description: 'Published 10 recipes',
    icon: '👨‍🍳',
  },
  SOCIAL_BUTTERFLY: {
    title: 'Social Butterfly',
    description: 'Reached 10 followers',
    icon: '🦋',
  },
};

// Idempotent: skips if the user already has an achievement with this title.
async function awardAchievement(userId: string, key: AchievementKey) {
  const definition = ACHIEVEMENT_DEFINITIONS[key];

  const existing = await prisma.achievement.findFirst({
    where: { userId, title: definition.title },
  });
  if (existing) return null;

  const achievement = await prisma.achievement.create({
    data: {
      userId,
      title: definition.title,
      description: definition.description,
      icon: definition.icon,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'achievement_earned',
      userId,
      targetUserId: userId,
      achievementId: achievement.id,
    },
  });

  return achievement;
}

export async function checkRecipeAchievements(userId: string) {
  const publishedCount = await prisma.recipe.count({
    where: { authorId: userId, status: 'published' },
  });

  if (publishedCount >= 1) {
    await awardAchievement(userId, 'FIRST_RECIPE');
  }
  if (publishedCount >= 10) {
    await awardAchievement(userId, 'MASTER_CHEF');
  }
}

export async function checkPopularRecipeAchievement(recipeId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true },
  });
  if (!recipe?.authorId) return;

  const likeCount = await prisma.recipeLike.count({ where: { recipeId } });
  if (likeCount >= 10) {
    await awardAchievement(recipe.authorId, 'POPULAR_RECIPE');
  }
}

export async function checkSocialButterflyAchievement(userId: string) {
  const followerCount = await prisma.follow.count({ where: { followingId: userId } });
  if (followerCount >= 10) {
    await awardAchievement(userId, 'SOCIAL_BUTTERFLY');
  }
}
