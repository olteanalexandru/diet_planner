
import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../lib/db';

// Destructive admin-only utility. Requires an authenticated session whose
// email is explicitly allow-listed via ADMIN_EMAILS (comma-separated).
// With no ADMIN_EMAILS configured, this endpoint denies everyone.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export async function POST() {
  try {
    const session = await getSession();
    const email = session?.user?.email?.toLowerCase();
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all data in the correct order to respect foreign key constraints
    await prisma.$transaction([
      // First level - No dependencies
      prisma.activityCommentLike.deleteMany(),
      prisma.commentLike.deleteMany(),
      prisma.recipeLike.deleteMany(),
      prisma.activityLike.deleteMany(),
      prisma.collectionRecipe.deleteMany(),

      // Second level - Depends on first level
      prisma.activityComment.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.mealPlan.deleteMany(),

      // Third level - Activity and Achievement
      prisma.activity.deleteMany(),
      prisma.achievement.deleteMany(),

      // Fourth level - Recipe and Collection
      prisma.recipe.deleteMany(),
      prisma.collection.deleteMany(),

      // Fifth level - User relationships
      prisma.follow.deleteMany(),

      // Final level - Users
      prisma.user.deleteMany(),
    ]);

    return NextResponse.json({
      message: 'Database cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: 'Failed to clear database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }

}
