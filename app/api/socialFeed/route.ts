import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.sub },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);

    const activities = await prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      include: { user: true, recipe: true },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent activities
    });

    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      userName: activity.user.name,
      action: activity.action,
      recipeId: activity.recipeId,
      recipeTitle: activity.recipe.title,
      timestamp: activity.createdAt.toISOString(),
    }));

    return NextResponse.json({ activities: formattedActivities });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json({ error: 'Error fetching social feed' }, { status: 500 });
  }
}