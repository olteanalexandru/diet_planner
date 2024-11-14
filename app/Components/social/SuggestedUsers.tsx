import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { FollowButton } from '../FollowButton';

interface SuggestedUser {
  id: string;
  name: string;
  avatar?: string;
  recipeCount: number;
  followerCount: number;
}

export const SuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const response = await fetch('/api/users/suggested');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, []);

  if (loading) {
    return (
      <div className="card-cyber p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={18} />
          Suggested Users
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-space-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-space-700 rounded w-24" />
                <div className="h-3 bg-space-700 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!users.length) {
    return null;
  }

  return (
    <div className="card-cyber p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users size={18} />
        Suggested Users
      </h2>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Link href={`/profile/${user.id}`}>
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            </Link>
            <div className="flex-1 min-w-0">
              <Link 
                href={`/profile/${user.id}`}
                className="font-medium hover:text-cyber-primary truncate block"
              >
                {user.name}
              </Link>
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <span>{user.recipeCount} recipes</span>
                <span>•</span>
                <span>{user.followerCount} followers</span>
              </div>
            </div>
            <FollowButton userId={user.id} />
          </div>
        ))}
      </div>
    </div>
  );
};
