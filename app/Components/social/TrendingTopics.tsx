import { useEffect, useState } from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface TrendingTopic {
  tag: string;
  count: number;
  growth: number;
}

export const TrendingTopics = () => {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const response = await fetch('/api/social/trending');
        if (response.ok) {
          const data = await response.json();
          setTopics(data.topics);
        }
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingTopics();
  }, []);

  if (loading) {
    return (
      <div className="card-cyber p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} />
          Trending Topics
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-8 bg-space-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!topics.length) {
    return null;
  }

  return (
    <div className="card-cyber p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} />
        Trending Topics
      </h2>
      <div className="space-y-1">
        {topics.map((topic) => (
          <Link
            key={topic.tag}
            href={`/recipes?tag=${encodeURIComponent(topic.tag)}`}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-space-700 group transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-cyber-primary">{topic.tag}</span>
              <span className="text-xs text-gray-400">
                {topic.count.toLocaleString()} posts
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <span className={`text-xs ${
                topic.growth > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {topic.growth > 0 ? '+' : ''}{topic.growth}%
              </span>
              <ChevronRight 
                size={16} 
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

