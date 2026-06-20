'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, UserPlus, UserMinus, Bell } from 'lucide-react';

interface NotificationActor {
  id: string;
  name: string;
  avatar?: string | null;
}

interface NotificationRecipe {
  id: string;
  title: string;
}

interface Notification {
  id: string;
  type: string;
  createdAt: string;
  readAt: string | null;
  user: NotificationActor;
  recipe: NotificationRecipe | null;
}

function describeNotification(notification: Notification) {
  const actor = notification.user?.name || 'Someone';

  switch (notification.type) {
    case 'recipe_liked':
      return { icon: <Heart size={18} className="text-pink-400" />, text: `${actor} liked your recipe`, href: notification.recipe ? `/recipe/${notification.recipe.id}` : '/dashboard' };
    case 'commented':
      return { icon: <MessageCircle size={18} className="text-cyber-primary" />, text: `${actor} commented on your recipe`, href: notification.recipe ? `/recipe/${notification.recipe.id}` : '/dashboard' };
    case 'started_following':
      return { icon: <UserPlus size={18} className="text-green-400" />, text: `${actor} started following you`, href: `/profile/${notification.user?.id}` };
    case 'unfollowed':
      return { icon: <UserMinus size={18} className="text-space-400" />, text: `${actor} unfollowed you`, href: `/profile/${notification.user?.id}` };
    default:
      return { icon: <Bell size={18} className="text-space-400" />, text: `${actor} interacted with your content`, href: '/dashboard' };
  }
}

export default function NotificationsPage() {
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
      <h1 className="text-2xl font-bold text-white mb-6">Notifications</h1>

      {loading && <p className="text-space-400">Loading...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-space-400">You don&apos;t have any notifications yet.</p>
      )}

      <ul className="space-y-2">
        {notifications.map((notification) => {
          const { icon, text, href } = describeNotification(notification);
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
