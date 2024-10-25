
import React from 'react';
import { TrendingUp } from 'lucide-react';

export const TrendingTopics: React.FC = () => {
  const trendingTopics = [
    { tag: '#HealthyEating', count: 1234 },
    { tag: '#QuickMeals', count: 987 },
    { tag: '#VeganRecipes', count: 756 },
    { tag: '#ComfortFood', count: 543 },
    { tag: '#BakingTips', count: 432 },
  ];

  return (
    <div className="card-cyber p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} />
        Trending Topics
      </h2>
      <div className="space-y-3">
        {trendingTopics.map((topic) => (
          <div
            key={topic.tag}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-space-700 transition-colors"
          >
            <span className="text-cyber-primary">{topic.tag}</span>
            <span className="text-sm text-gray-400">{topic.count} posts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

