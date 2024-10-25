
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { formatRelative } from 'date-fns';
import { ActivityGroup, SocialActivity } from '../../types/social';

const prisma = new PrismaClient();
const ITEMS_PER_PAGE = 10;

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');

    const activities = await prisma.activity.findMany({
      take: ITEMS_PER_PAGE + 1,
      skip: (page - 1) * ITEMS_PER_PAGE,
      where: {
        userId: session.user.sub,
      },
      include: {
        user: true,
        targetUser: true,
        recipe: true,
        ActivityLike: true,
        ActivityComment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hasMore = activities.length > ITEMS_PER_PAGE;
    const paginatedActivities = activities.slice(0, ITEMS_PER_PAGE);

    const formattedActivities = paginatedActivities.map(activity => ({
      id: activity.id,
      type: activity.type,
      userId: activity.userId,
      userName: activity.user.name || '',
      targetUserId: activity.targetUserId,
      targetUserName: activity.targetUser?.name,
      recipeId: activity.recipeId,
      recipeTitle: activity.recipe?.title,
      recipeImage: activity.recipe?.imageUrl,
      timestamp: activity.createdAt,
      interactions: {
        likes: activity.ActivityLike.length,
        comments: activity.ActivityComment.length,
        hasLiked: activity.ActivityLike.some(like => like.userId === session.user.sub),
      },
    }));

    const groupedActivities = groupActivitiesByDate(formattedActivities);

    return NextResponse.json({
      activities: groupedActivities,
      hasMore,
    });
  } catch (error) {
    console.error('Error fetching social feed:', error);
    return NextResponse.json(
      { error: 'Error fetching social feed' },
      { status: 500 }
    );
  }
}

function groupActivitiesByDate(activities: SocialActivity[]): ActivityGroup[] {
  return Object.entries(
    activities.reduce((groups: Record<string, SocialActivity[]>, activity) => {
      const date = formatRelative(new Date(activity.timestamp), new Date());
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
      return groups;
    }, {})
  ).map(([date, activities]) => ({
    date,
    activities,
  }));
}

// Helper functions
function getStartDate(timeframe: string, now: Date): Date | null {
  switch (timeframe) {
    case 'today':
      return startOfDay(now);
    case 'week':
      return startOfWeek(now);
    case 'month':
      return startOfMonth(now);
    default:
      return null;
  }
}

