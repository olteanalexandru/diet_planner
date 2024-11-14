import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Delete all data in the correct order to respect foreign key constraints
    await prisma.$transaction([
      // First level - No dependencies
      prisma.commentLike.deleteMany(),
      prisma.recipeLike.deleteMany(),
      prisma.activityLike.deleteMany(),
      prisma.activityComment.deleteMany(),
      
      // Second level - Depends on first level
      prisma.comment.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.mealPlan.deleteMany(),
      
      // Third level - Main content
      prisma.recipe.deleteMany(),
      
      // Fourth level - User related
      prisma.follow.deleteMany(),
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