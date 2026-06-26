import prisma from './db';

export const FREE_PLAN_LIMITS = {
  monthlyGenerations: 5,
  maxCollections: 3,
};

export function isPremiumUser(user: { subscriptionStatus?: string | null } | null | undefined) {
  return user?.subscriptionStatus === 'premium';
}

// Resets the monthly generation counter if the user's reset window has elapsed,
// then returns the (possibly refreshed) user record.
export async function getUserWithFreshGenerationWindow(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  if (user.generationsResetAt < oneMonthAgo) {
    return prisma.user.update({
      where: { id: userId },
      data: { monthlyGenerations: 0, generationsResetAt: new Date() },
    });
  }

  return user;
}

export async function canGenerateRecipe(userId: string) {
  const user = await getUserWithFreshGenerationWindow(userId);
  if (!user) return { allowed: false, remaining: 0 };
  if (isPremiumUser(user)) return { allowed: true, remaining: Infinity };

  const remaining = FREE_PLAN_LIMITS.monthlyGenerations - user.monthlyGenerations;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export async function recordRecipeGeneration(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { monthlyGenerations: { increment: 1 } },
  });
}

// Strips ingredients/instructions from premium-exclusive recipes for viewers
// who don't own the recipe and aren't premium subscribers.
export function applyPremiumLock<
  T extends { isPremium?: boolean | null; authorId?: string | null; ingredients: string[]; instructions: string[] }
>(recipe: T, viewerId: string | null | undefined, viewerIsPremium: boolean): T & { locked: boolean } {
  const isOwner = !!viewerId && viewerId === recipe.authorId;
  if (recipe.isPremium && !isOwner && !viewerIsPremium) {
    return { ...recipe, ingredients: [], instructions: [], locked: true };
  }
  return { ...recipe, locked: false };
}
