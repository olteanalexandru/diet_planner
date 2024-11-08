import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { formatRelative } from 'date-fns';
import { 
  ActivityGroup, 
  SocialActivity, 
  ActivityType,
  ActivityQueryWhere,
  ActivityOrderBy,
  DBActivity
} from '../../types/social';

// Create PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ITEMS_PER_PAGE = 10;

// Update the GET handler
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const category = searchParams.get('category') || 'all';
    const sortBy = searchParams.get('sortBy') || 'trending';
    const timeFrame = searchParams.get('timeFrame');

    // Build where clause based on filters
    const where: ActivityQueryWhere = {
      userId: session.user.sub,
    };

    if (category !== 'all') {
      where.type = category as ActivityType;
    }

    if (timeFrame) {
      const date = new Date();
      switch (timeFrame) {
        case 'today':
          date.setHours(0, 0, 0, 0);
          break;
        case 'week':
          date.setDate(date.getDate() - 7);
          break;
        case 'month':
          date.setMonth(date.getMonth() - 1);
          break;
      }
      where.createdAt = { gte: date };
    }

    // Build orderBy based on sort option
    const orderBy: ActivityOrderBy[] = sortBy === 'trending' 
      ? [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' }
        ]
      : [{ createdAt: 'desc' }];

    const activities: DBActivity[] = await prisma.activity.findMany({
      take: ITEMS_PER_PAGE + 1,
      skip: (page - 1) * ITEMS_PER_PAGE,
      where,
      orderBy,
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        targetUser: {
          select: {
            name: true
          }
        },
        recipe: {
          select: {
            title: true,
            imageUrl: true
          }
        },
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        },
      },
    });

    const hasMore = activities.length > ITEMS_PER_PAGE;
    const paginatedActivities = activities.slice(0, ITEMS_PER_PAGE);

    const formattedActivities: SocialActivity[] = paginatedActivities.map(activity => ({
      id: activity.id,
      type: activity.type as ActivityType,
      userId: activity.userId,
      userName: activity.user?.name || '',
      userImage: activity.user?.avatar || undefined,
      targetUserId: activity.targetUserId || undefined,
      targetUserName: activity.targetUser?.name || undefined,
      recipeId: activity.recipeId || undefined,
      recipeTitle: activity.recipe?.title || undefined,
      recipeImage: activity.recipe?.imageUrl || undefined,
      milestone: activity.milestone || undefined,
      achievementId: activity.achievementId || undefined,
      timestamp: activity.createdAt,
      interactions: {
        likes: activity.likes.length,
        comments: activity.comments.length,
        hasLiked: activity.likes.some(like => like.userId === session.user.sub),
      }
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
  const now = new Date();
  return Object.entries(
    activities.reduce((groups: Record<string, SocialActivity[]>, activity) => {
      const date = formatRelative(
        typeof activity.timestamp === 'string' 
          ? new Date(activity.timestamp) 
          : activity.timestamp,
        now
      );
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
