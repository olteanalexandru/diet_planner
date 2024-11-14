import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { formatRelative } from 'date-fns';
import { 
  ActivityGroup, 
  SocialActivity, 
  ActivityType,
  Achievement
} from '../../types/social';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const ITEMS_PER_PAGE = 10;

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

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
    const where: Prisma.ActivityWhereInput = {};

    if (category !== 'all') {
      where.type = category;
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

    // Get followed users
    const followedUsers = await prisma.follow.findMany({
      where: {
        followerId: session.user.sub
      },
      select: {
        followingId: true
      }
    });

    // Include activities from followed users and the current user
    where.OR = [
      { userId: session.user.sub },
      { userId: { in: followedUsers.map(follow => follow.followingId) } }
    ];

    // Build orderBy based on sort option
    const orderBy: Prisma.ActivityOrderByWithRelationInput[] = sortBy === 'trending' 
      ? [
          { likes: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' }
        ]
      : [{ createdAt: 'desc' }];

    const activities = await prisma.activity.findMany({
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
        likes: {
          select: {
            userId: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      },
    });

    const hasMore = activities.length > ITEMS_PER_PAGE;
    const paginatedActivities = activities.slice(0, ITEMS_PER_PAGE);

    const formattedActivities: SocialActivity[] = await Promise.all(
      paginatedActivities.map(async (activity) => {
        let achievementData: Achievement | undefined;
        if (activity.achievementId) {
          const achievement = await prisma.achievement.findUnique({
            where: { id: activity.achievementId }
          });
          if (achievement) {
            achievementData = {
              id: achievement.id,
              title: achievement.title,
              description: achievement.description,
              icon: achievement.icon,
              userId: achievement.userId,
              unlockedAt: achievement.unlockedAt
            };
          }
        }

        return {
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
          achievement: achievementData,
          timestamp: activity.createdAt,
          interactions: {
            likes: activity.likes.length,
            comments: activity.comments.length,
            hasLiked: activity.likes.some(like => like.userId === session.user.sub),
            hasCommented: activity.comments.some(comment => comment.user?.name === session.user.name)
          }
        };
      })
    );

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
