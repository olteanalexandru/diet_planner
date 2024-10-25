import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { User } from '../../types';
import Link from 'next/link';

export const SuggestedUsers = () => {
  const { user } = useUser();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('/api/users/suggestions');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [user]);

  const handleFollow = async (userId: string) => {
    try {
      const response = await fetch('/api/followUsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: userId }),
      });

      if (response.ok) {
        setSuggestions(prev =>
          prev.map(suggestion =>
            suggestion.id === userId
              ? { ...suggestion, isFollowing: true }
              : suggestion
          )
        );
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  if (loading) {
    return (
      <div className="card-cyber p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users size={18} />
          Suggested Users
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-space-700" />
              <div className="flex-grow">
                <div className="h-4 bg-space-700 rounded w-24" />
                <div className="h-3 bg-space-700 rounded w-16 mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return null;
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
            <Link 
              href={`/profile/${suggestion.id}`}
              className="flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-cyber-primary/10 flex items-center justify-center">
                <span className="text-lg">
                  {suggestion.name?.[0].toUpperCase()}
                </span>
              </div>
            </Link>
            
            <div className="flex-grow min-w-0">
              <Link 
                href={`/profile/${suggestion.id}`}
                className="font-medium text-gray-300 hover:text-cyber-primary transition-colors duration-200 block truncate"
              >
                {suggestion.name}
              </Link>
              <p className="text-sm text-gray-400 truncate">
                {suggestion._count?.recipes || 0} recipes
              </p>
            </div>

            <button
              onClick={() => handleFollow(suggestion.id)}
              disabled={suggestion.isFollowing}
              className={`btn-cyber-outline py-1 px-3 text-sm ${
                suggestion.isFollowing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-cyber-primary hover:text-space-900'
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