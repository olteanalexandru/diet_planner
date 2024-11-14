import React from 'react';
import { Award } from 'lucide-react';

interface AchievementModalProps {
  achievement: {
    title: string;
    description: string;
    icon: string;
  };
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievement,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-space-800 rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <div className="relative">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2">
            <div className="w-32 h-32 rounded-full bg-cyber-primary/10 flex items-center justify-center animate-pulse">
              <Award size={64} className="text-cyber-primary" />
            </div>
          </div>
        </div>
        
        <div className="mt-20 space-y-4">
          <h2 className="text-2xl font-bold text-cyber-primary">
            Achievement Unlocked!
          </h2>
          <h3 className="text-xl font-semibold">{achievement.title}</h3>
          <p className="text-gray-400">{achievement.description}</p>
          
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={onClose} className="btn-cyber-outline">
              Close
            </button>
            <button className="btn-cyber flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg" 
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};