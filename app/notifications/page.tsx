'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, UserPlus, UserMinus, Bell, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../translations';

interface NotificationActor {
  id: string;
  name: string;
  avatar?: string | null;
}

interface NotificationRecipe {
  id: string;
  title: string;
}

interface NotificationAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Notification {
  id: string;
  type: string;
  createdAt: string;
  readAt: string | null;
  user: NotificationActor;
  recipe: NotificationRecipe | null;
  achievement: NotificationAchievement | null;
}

function describeNotification(notification: Notification, t: (key: TranslationKey, params?: Record<string, string | number>) => string) {
  const actor = notification.user?.name || t('notifications.someone');

  switch (notification.type) {
    case 'recipe_liked':
      return { icon: <Heart size={18} className="text-pink-400" />, text: t('notifications.recipeLiked', { actor }), href: notification.recipe ? `/recipe/${notification.recipe.id}` : '/dashboard' };
    case 'commented':
      return { icon: <MessageCircle size={18} className="text-cyber-primary" />, text: t('notifications.commented', { actor }), href: notification.recipe ? `/recipe/${notification.recipe.id}` : '/dashboard' };
    case 'started_following':
      return { icon: <UserPlus size={18} className="text-green-400" />, text: t('notifications.startedFollowing', { actor }), href: `/profile/${notification.user?.id}` };
    case 'unfollowed':
      return { icon: <UserMinus size={18} className="text-space-400" />, text: t('notifications.unfollowed', { actor }), href: `/profile/${notification.user?.id}` };
    case 'achievement_earned':
      return {
        icon: <Award size={18} className="text-yellow-400" />,
        text: notification.achievement
          ? t('notifications.achievementUnlocked', { title: notification.achievement.title, icon: notification.achievement.icon })
          : t('notifications.achievementGeneric'),
        href: '/dashboard',
      };
    default:
      return { icon: <Bell size={18} className="text-space-400" />, text: t('notifications.defaultInteraction', { actor }), href: '/dashboard' };
  }
}

export default function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notifications');
        return res.json();
      })
      .then((data) => {
        setNotifications(data.notifications || []);
        if (data.unreadCount > 0) {
          fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-space-50 mb-6">{t('notifications.title')}</h1>

      {loading && <p className="text-space-400">{t('notifications.loading')}</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-space-400">{t('notifications.empty')}</p>
      )}

      <ul className="space-y-2">
        {notifications.map((notification) => {
          const { icon, text, href } = describeNotification(notification, t);
          return (
            <li key={notification.id}>
              <Link
                href={href}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                  notification.readAt
                    ? 'border-space-700 bg-space-800/50'
                    : 'border-cyber-primary/40 bg-space-800'
                } hover:bg-space-700`}
              >
                {icon}
                <span className="text-space-200">{text}</span>
                <span className="ml-auto text-xs text-space-500">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
