import React from 'react';
import { ChefHat, Heart, MessageCircle } from 'lucide-react';

interface ActivityMetricsProps {
  likes: number;
  comments: number;
  shares: number;
  className?: string;
}

export const ActivityMetrics: React.FC<ActivityMetricsProps> = ({
  likes,
  comments,
  shares,
  className = '',
}) => {
  const metrics = [
    { icon: <Heart size={16} />, value: likes, label: 'likes' },
    { icon: <MessageCircle size={16} />, value: comments, label: 'comments' },
    { icon: <ChefHat size={16} />, value: shares, label: 'shares' },
  ];

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {metrics.map(({ icon, value, label }) => (
        <div key={label} className="flex items-center gap-1 text-gray-400">
          {icon}
          <span className="text-sm">
            {value.toLocaleString()} {label}
          </span>
        </div>
      ))}
    </div>
  );
};