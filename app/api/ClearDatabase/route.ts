
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete all data in the correct order to respect foreign key constraints
    await prisma.$transaction([
      // First level - No dependencies
      prisma.activityCommentLike.deleteMany(),
      prisma.commentLike.deleteMany(),
      prisma.recipeLike.deleteMany(),
      prisma.activityLike.deleteMany(),
      
      // Second level - Depends on first level
      prisma.activityComment.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.mealPlan.deleteMany(),
      
      // Third level - Activity and Achievement
      prisma.activity.deleteMany(),
      prisma.achievement.deleteMany(),
      
      // Fourth level - Recipe
      prisma.recipe.deleteMany(),
      
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
