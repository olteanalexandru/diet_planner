
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;

  try {
    // Fetch all stats in parallel for better performance
    const [recipesCount, followersCount, followingCount] = await Promise.all([
      // Count user's recipes
      prisma.recipe.count({
        where: { authorId: userId }
      }),
      
      // Count user's followers
      prisma.follow.count({
        where: { followingId: userId }
      }),
      
      // Count who the user is following
      prisma.follow.count({
        where: { followerId: userId }
      })
    ]);

    return NextResponse.json({
      recipesCount,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}