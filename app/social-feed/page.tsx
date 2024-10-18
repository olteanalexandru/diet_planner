'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recipeId: string;
  recipeTitle: string;
  timestamp: string;
}

export default function SocialFeed() {
  const { user, isLoading } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/socialFeed');
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      const data = await response.json();
      setActivities(data.activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Failed to load social feed');
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view the social feed.</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h1>Social Feed</h1>
      {activities.length === 0 ? (
        <p>No recent activities from your network.</p>
      ) : (
        <ul className="list-group">
          {activities.map((activity) => (
            <li key={activity.id} className="list-group-item">
              <strong>{activity.userName}</strong> {activity.action}{' '}
              <Link href={`/recipe/${activity.recipeId}`}>
                {activity.recipeTitle}
              </Link>
              <br />
              <small className="text-muted">{new Date(activity.timestamp).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}