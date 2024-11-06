import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { formatRelative } from 'date-fns';
import { ActivityGroup, SocialActivity, ActivityType } from '../../types/social';

// Create PrismaClient singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

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
      orderBy: {
        createdAt: 'desc',
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
