import React, { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSocialFeed } from '../context/SocialFeedContext';
import { ActivityCard } from './social/ActivityCard';
import { SuggestedUsers } from './social/SuggestedUsers';

export const SocialFeed: React.FC = () => {
  const { user } = useUser();
  const { activities, fetchActivities, isLoading, error, hasMore } = useSocialFeed();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchActivities(page);
    }
  }, [user, page, fetchActivities]);

  const loadMoreActivities = () => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  };

  if (isLoading && page === 1) return <div>Loading social feed...</div>;
  if (error) return <div className="text-danger">{error}</div>;

  return (
    <div className="container mt-5">
      <h2>Social Feed</h2>
      {activities.length === 0 ? (
        <p>No recent activities from your network.</p>
      ) : (
        <ul className="list-group">
          {activities.map((group) => (
            <li key={group.date} className="list-group-item">
              <h3>{group.date}</h3>
              {group.activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </li>
          ))}
        </ul>
      )}
      {hasMore && (
        <div className="text-center mt-4">
          <button onClick={loadMoreActivities} className="btn btn-primary">
            Load More
          </button>
        </div>
      )}
      <SuggestedUsers />
    </div>
  );
};
