import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import prisma from '../../lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.activity.findMany({
        where: { targetUserId: session.user.sub },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          recipe: { select: { id: true, title: true } },
        },
      }),
      prisma.activity.count({
        where: { targetUserId: session.user.sub, readAt: null },
      }),
    ]);

    const achievementIds = notifications
      .map((notification) => notification.achievementId)
      .filter((id): id is string => !!id);

    const achievements = achievementIds.length
      ? await prisma.achievement.findMany({ where: { id: { in: achievementIds } } })
      : [];
    const achievementsById = new Map(achievements.map((achievement) => [achievement.id, achievement]));

    const notificationsWithAchievements = notifications.map((notification) => ({
      ...notification,
      achievement: notification.achievementId ? achievementsById.get(notification.achievementId) ?? null : null,
    }));

    return NextResponse.json({ notifications: notificationsWithAchievements, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json().catch(() => ({ id: undefined }));

    await prisma.activity.updateMany({
      where: {
        targetUserId: session.user.sub,
        readAt: null,
        ...(id ? { id } : {}),
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
