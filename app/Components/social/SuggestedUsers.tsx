import React from 'react';
import { Users } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface SuggestedUser {
  id: string;
  name: string;
  bio: string;
  followers: number;
  isFollowing: boolean;
}

export const SuggestedUsers: React.FC = () => {
  const { user } = useUser();
  const [suggestions, setSuggestions] = React.useState<SuggestedUser[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/users/suggestions');
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await fetch('/api/followUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });
      
      setSuggestions(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, isFollowing: true } : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <div className="card-cyber p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-space-700 rounded-full" />
              <div className="flex-grow">
                <div className="h-4 bg-space-700 rounded w-24 mb-2" />
                <div className="h-3 bg-space-700 rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-cyber p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Users size={18} />
        Suggested Users
      </h2>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-space-700 flex items-center justify-center">
              <span className="text-lg">
                {suggestion.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="text-sm font-medium text-gray-300 truncate">
                {suggestion.name}
              </h3>
              <p className="text-xs text-gray-400">
                {suggestion.followers.toLocaleString()} followers
              </p>
            </div>
            <button
              onClick={() => handleFollow(suggestion.id)}
              disabled={suggestion.isFollowing}
              className={`btn-cyber-outline py-1 px-3 text-sm ${
                suggestion.isFollowing
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {suggestion.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};