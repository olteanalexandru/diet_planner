import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Delete all data in the correct order to respect foreign key constraints
    await prisma.$transaction([
      prisma.commentLike.deleteMany(),
      prisma.activityCommentLike.deleteMany(),
      prisma.activityComment.deleteMany(),
      prisma.activityLike.deleteMany(),
      prisma.activity.deleteMany(),
      prisma.comment.deleteMany(),
      prisma.favorite.deleteMany(),
      prisma.follow.deleteMany(),
      prisma.mealPlan.deleteMany(),
      prisma.recipe.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    return NextResponse.json({ message: 'Database cleared successfully' });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json({ error: 'Failed to clear database' }, { status: 500 });
  }
}



